var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const ai = new import_genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  const MAX_CHARACTERS = 1e4;
  const COOLDOWN_MS = 5e3;
  const MAX_PER_MINUTE = 8;
  const MAX_PER_HOUR = 40;
  const reqHistory = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of reqHistory.entries()) {
      if (now - record.lastRequest > 36e5) {
        reqHistory.delete(ip);
      }
    }
  }, 18e5);
  function getClientIp(req) {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    if (Array.isArray(rawIp)) return rawIp[0];
    return String(rawIp).split(",")[0].trim();
  }
  function checkRateLimit(req) {
    const ip = getClientIp(req);
    const now = Date.now();
    let record = reqHistory.get(ip);
    if (!record) {
      record = {
        lastRequest: 0,
        minuteStart: now,
        minuteCount: 0,
        hourStart: now,
        hourCount: 0
      };
      reqHistory.set(ip, record);
    }
    if (now - record.lastRequest < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - (now - record.lastRequest)) / 1e3);
      return {
        allowed: false,
        message: `Cooldown limit active: Please wait ${waitSec} second(s) before retry.`
      };
    }
    if (now - record.minuteStart >= 6e4) {
      record.minuteStart = now;
      record.minuteCount = 0;
    }
    if (record.minuteCount >= MAX_PER_MINUTE) {
      return {
        allowed: false,
        message: `Too many write tasks: Limit is ${MAX_PER_MINUTE} operations/min. Resets soon.`
      };
    }
    if (now - record.hourStart >= 36e5) {
      record.hourStart = now;
      record.hourCount = 0;
    }
    if (record.hourCount >= MAX_PER_HOUR) {
      return {
        allowed: false,
        message: `Hourly AI limit reached (${MAX_PER_HOUR} allowed/hr) to guard subscription costs. Please try again later.`
      };
    }
    record.lastRequest = now;
    record.minuteCount++;
    record.hourCount++;
    reqHistory.set(ip, record);
    return { allowed: true };
  }
  app.post("/api/editor/autocorrect", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text has been provided to autocorrect." });
      }
      if (text.length > MAX_CHARACTERS) {
        return res.status(400).json({
          error: `The text is too long (${text.length} characters). Maximum allowed is ${MAX_CHARACTERS} characters (~1,500 words) per individual operation to safeguard tokens.`
        });
      }
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
        contents: prompt
      });
      const correctedText = response.text || text;
      res.json({ correctedText });
    } catch (err) {
      console.error("[GEMINI] Autocorrect Engine Error:", err);
      res.status(500).json({ error: err.message || "Grammar Autocorrect service encountered an issue." });
    }
  });
  app.post("/api/editor/plagiarism-check", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "No text has been provided to verify originality." });
      }
      if (text.length > MAX_CHARACTERS) {
        return res.status(400).json({
          error: `The text is too long (${text.length} characters). Maximum allowed is ${MAX_CHARACTERS} characters (~1,500 words) per individual operation to safeguard tokens.`
        });
      }
      const rateStatus = checkRateLimit(req);
      if (!rateStatus.allowed) {
        return res.status(429).json({ error: rateStatus.message });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "Gemini API environment variable is not configured." });
      }
      const prompt = `Conduct a rigorous originality scan and literary similarity audit on the section below. 
Check for generic expressions, predictable plot clich\xE9s, typical idiom overlaps, duplicate formulations, or resemblance to existing prominent literary classics, prose pieces, or tropes.
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
                description: "Unique originality score from 0 to 100, where 100 represents completely fresh, unique literary writing, and 0 indicates blatant copying, excessive clich\xE9s, or plagiarism."
              },
              status: {
                type: "STRING",
                description: "Human status categorization: 'Highly Original', 'Low Risk', 'Moderate Risk', 'High Risk/Plagiarism Concerns'"
              },
              overallAnalysis: {
                type: "STRING",
                description: "A comprehensive 2-3 paragraph stylistic analysis and literary uniqueness evaluation."
              },
              flaggedSections: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    phrase: {
                      type: "STRING",
                      description: "The targeted copy sequence, clich\xE9, or phrase that raised originality flags."
                    },
                    similarityReason: {
                      type: "STRING",
                      description: "The specific reason it was flagged (e.g. 'Trope overlap with Hamlet', 'Overused 19th-century gothic clich\xE9', 'Common rhetorical idiom')."
                    },
                    suggestedAlternative: {
                      type: "STRING",
                      description: "An elegant, polished, or stylized alternative phrasing to enhance the manuscript's distinct character."
                    }
                  },
                  required: ["phrase", "similarityReason", "suggestedAlternative"]
                },
                description: "A detailed list of potential plagiarism risks, clich\xE9 overlaps, or generic patterns with corrections."
              }
            },
            required: ["originalityScore", "status", "overallAnalysis", "flaggedSections"]
          }
        }
      });
      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini Engine.");
      }
      const parsedContent = JSON.parse(responseText.trim());
      res.json(parsedContent);
    } catch (err) {
      console.error("[GEMINI] Plagiarism Check Engine Error:", err);
      res.status(500).json({ error: err.message || "Plagiarism checking service encountered an issue." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Draftsmith Server] Running at http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
