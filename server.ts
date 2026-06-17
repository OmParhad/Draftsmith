import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Essential middleware
  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini client on the server
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Token Safeguard / Simple Rate Limiting System to protect API budgets
  const MAX_CHARACTERS = 10000; // Strict limit to ~1,500-1,800 words to safeguard tokens
  const COOLDOWN_MS = 5000;    // 5-second cooldown safety delay
  const MAX_PER_MINUTE = 8;     // Max 8 transactions/min
  const MAX_PER_HOUR = 40;      // Max 40 requests/hour

  interface RateRecord {
    lastRequest: number;
    minuteStart: number;
    minuteCount: number;
    hourStart: number;
    hourCount: number;
  }

  const reqHistory = new Map<string, RateRecord>();

  // Periodically sweep map to avoid memory inflation from stale IPs
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of reqHistory.entries()) {
      if (now - record.lastRequest > 3600000) {
        reqHistory.delete(ip);
      }
    }
  }, 1800000); // Clean stale IPs every 30 minutes

  function getClientIp(req: express.Request): string {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (Array.isArray(rawIp)) return rawIp[0];
    return String(rawIp).split(",")[0].trim();
  }

  function checkRateLimit(req: express.Request): { allowed: boolean; message?: string } {
    const ip = getClientIp(req);
    const now = Date.now();

    let record = reqHistory.get(ip);
    if (!record) {
      record = {
        lastRequest: 0,
        minuteStart: now,
        minuteCount: 0,
        hourStart: now,
        hourCount: 0,
      };
      reqHistory.set(ip, record);
    }

    // 1. Cooldown Safeguard
    if (now - record.lastRequest < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - record.lastRequest)) / 1000);
      return {
        allowed: false,
        message: `Cooldown limit active: Please wait ${waitSec} second(s) before retry.`,
      };
    }

    // 2. Minute Rate limit Checks
    if (now - record.minuteStart >= 60000) {
      record.minuteStart = now;
      record.minuteCount = 0;
    }
    if (record.minuteCount >= MAX_PER_MINUTE) {
      return {
        allowed: false,
        message: `Too many write tasks: Limit is ${MAX_PER_MINUTE} operations/min. Resets soon.`,
      };
    }

    // 3. Hourly Safeguard limit
    if (now - record.hourStart >= 3600000) {
      record.hourStart = now;
      record.hourCount = 0;
    }
    if (record.hourCount >= MAX_PER_HOUR) {
      return {
        allowed: false,
        message: `Hourly AI limit reached (${MAX_PER_HOUR} allowed/hr) to guard subscription costs. Please try again later.`,
      };
    }

    // Advance and record state
    record.lastRequest = now;
    record.minuteCount++;
    record.hourCount++;
    reqHistory.set(ip, record);

    return { allowed: true };
  }

  // REST API: Grammar Autocorrect Endpoint
  app.post("/api/editor/autocorrect", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text has been provided to autocorrect." });
      }

      // Check text character envelope
      if (text.length > MAX_CHARACTERS) {
        return res.status(400).json({ 
          error: `The text is too long (${text.length} characters). Maximum allowed is ${MAX_CHARACTERS} characters (~1,500 words) per individual operation to safeguard tokens.` 
        });
      }

      // Check rate restriction quota
      const rateStatus = checkRateLimit(req);
      if (!rateStatus.allowed) {
        return res.status(429).json({ error: rateStatus.message });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini API environment variable is not configured." });
      }

      const prompt = `Autocorrect the spelling, typos, grammar, and syntax in the text block below. 
You must keep the existing tone, flow, formatting (such as markdown headers like # or ##, bullet points, numbers, bold markers, blank paragraph divisions, and dialogues) completely identical.
Do NOT write any introduction remarks, greeting flags, explanations, or meta-commentary. Return ONLY the polished, corrected text.

Here is the author's copy:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const correctedText = response.text || text;
      res.json({ correctedText });
    } catch (err: any) {
      console.error("[GEMINI] Autocorrect Engine Error:", err);
      res.status(500).json({ error: err.message || "Grammar Autocorrect service encountered an issue." });
    }
  });

  // REST API: Plagiarism and Originality Checker Endpoint
  app.post("/api/editor/plagiarism-check", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text has been provided to verify originality." });
      }

      // Check text character envelope
      if (text.length > MAX_CHARACTERS) {
        return res.status(400).json({ 
          error: `The text is too long (${text.length} characters). Maximum allowed is ${MAX_CHARACTERS} characters (~1,500 words) per individual operation to safeguard tokens.` 
        });
      }

      // Check rate restriction quota
      const rateStatus = checkRateLimit(req);
      if (!rateStatus.allowed) {
        return res.status(429).json({ error: rateStatus.message });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini API environment variable is not configured." });
      }

      const prompt = `Conduct a rigorous originality scan and literary similarity audit on the section below. 
Check for generic expressions, predictable plot clichés, typical idiom overlaps, duplicate formulations, or resemblance to existing prominent literary classics, prose pieces, or tropes.
Explain where and how the author can improve uniqueness and avoid derivative formatting.

Evaluate and return the results as a clean JSON structure conforming EXACTLY to the following schema outline.

Text to analyze:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              originalityScore: {
                type: "INTEGER",
                description: "Unique originality score from 0 to 100, where 100 represents completely fresh, unique literary writing, and 0 indicates blatant copying, excessive clichés, or plagiarism.",
              },
              status: {
                type: "STRING",
                description: "Human status categorization: 'Highly Original', 'Low Risk', 'Moderate Risk', 'High Risk/Plagiarism Concerns'",
              },
              overallAnalysis: {
                type: "STRING",
                description: "A comprehensive 2-3 paragraph stylistic analysis and literary uniqueness evaluation.",
              },
              flaggedSections: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    phrase: {
                      type: "STRING",
                      description: "The targeted copy sequence, cliché, or phrase that raised originality flags.",
                    },
                    similarityReason: {
                      type: "STRING",
                      description: "The specific reason it was flagged (e.g. 'Trope overlap with Hamlet', 'Overused 19th-century gothic cliché', 'Common rhetorical idiom').",
                    },
                    suggestedAlternative: {
                      type: "STRING",
                      description: "An elegant, polished, or stylized alternative phrasing to enhance the manuscript's distinct character.",
                    },
                  },
                  required: ["phrase", "similarityReason", "suggestedAlternative"],
                },
                description: "A detailed list of potential plagiarism risks, cliché overlaps, or generic patterns with corrections.",
              },
            },
            required: ["originalityScore", "status", "overallAnalysis", "flaggedSections"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini Engine.");
      }

      // Parse JSON safely and return
      const parsedContent = JSON.parse(responseText.trim());
      res.json(parsedContent);
    } catch (err: any) {
      console.error("[GEMINI] Plagiarism Check Engine Error:", err);
      res.status(500).json({ error: err.message || "Plagiarism checking service encountered an issue." });
    }
  });

  // Support for Vite dev server or production hosting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listening exclusively on port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Draftsmith Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
