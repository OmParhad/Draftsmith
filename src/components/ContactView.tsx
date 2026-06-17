import React, { useState } from 'react';
import { 
  ArrowLeft, Mail, Send, AlertCircle, Info, CheckCircle, Sparkles, Loader2
} from 'lucide-react';

interface ContactViewProps {
  onBackToLanding: () => void;
  onGoToStudio: () => void;
}

interface InquiryForm {
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
}

export const ContactView: React.FC<ContactViewProps> = ({ onBackToLanding, onGoToStudio }) => {
  const [form, setForm] = useState<InquiryForm>({
    name: '',
    email: '',
    topic: 'bug',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastMailtoUrl, setLastMailtoUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is Draftsmith completely free to use?",
      answer: "Yes, Draftsmith is 100% free and open-source. Because all typesetting, compiling, and text formatting happen entirely within your local browser's memory, we don't have server-side model fees or subscriptions. Anyone can use the full feature-set without paying anything."
    },
    {
      question: "Where is my manuscript draft stored?",
      answer: "Your writing stays exactly where it belongs: in your own hands. Draftsmith uses local offline storage buffers inside your browser. No data, drafts, or metadata are ever uploaded to an external server. Be sure to use the 'Download Backup File' tool in the Safeguard sidebar to save physical copies of your library."
    },
    {
      question: "What are the publisher manuscript submission rules?",
      answer: "Traditional literary agents and publishers expect standard layout compliance: double-spaced text, proportional margins (typically 1.0 inch), clear Running Headers with the author's last name on the top right, and legible serif typography like Garamond or Times. Draftsmith guarantees precise page-fit margins matching these criteria exactly."
    },
    {
      question: "How do I print or export my manuscript to PDF?",
      answer: "Head over to the 'Compile & Export' workspace tab. There you can set chapter division indicators, review pagination sheets, and select 'Generate Standard PDF' to print or download a high-resolution typeset layout ready for submission."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Prepare draft mailto URL structure prefilled with inquiry contents
    const subjectLine = `[Draftsmith Support] ${form.subject}`;
    const emailBody = `Sender Details:\n` +
      `Name: ${form.name}\n` +
      `Email: ${form.email}\n` +
      `Topic Category: ${form.topic}\n` +
      `Date: ${new Date().toLocaleString()}\n` +
      `----------------------------------------\n\n` +
      `Message Body:\n${form.message}\n\n` +
      `---\nInquiry submitted via Draftsmith Support Hub.`;
      
    const mailtoLink = `mailto:omparhad4@gmail.com?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(emailBody)}`;
    setLastMailtoUrl(mailtoLink);

    // Trigger system native mail client / redirect 
    try {
      window.location.href = mailtoLink;
    } catch (err) {
      console.warn("Could not automatically redirect client to mailto link", err);
    }

    try {
      // Send a ping to local server logs so the local console can see the submission
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setForm({
          name: '',
          email: '',
          topic: 'bug',
          subject: '',
          message: '',
        });
        setTimeout(() => setSubmitSuccess(false), 20000);
      } else {
        // Fallback success state because we already primed the direct mailto redirect as the primary action
        setSubmitSuccess(true);
        setForm({
          name: '',
          email: '',
          topic: 'bug',
          subject: '',
          message: '',
        });
        setTimeout(() => setSubmitSuccess(false), 20000);
      }
    } catch (err) {
      console.warn("Server unavailable, relying purely on direct email fallback", err);
      // Fallback success state because mailto is already opened!
      setSubmitSuccess(true);
      setForm({
        name: '',
        email: '',
        topic: 'bug',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitSuccess(false), 20000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-polish-bg text-polish-dark flex flex-col justify-between font-sans antialiased animate-fade-in relative" id="contact-viewport">
      
      {/* Header */}
      <header className="bg-[#FAF9F5] border-b border-polish-border px-6 md:px-10 py-4 sticky top-0 z-50 flex items-center justify-between shadow-sm" id="contact-header">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-polish-text hover:text-polish-dark transition cursor-pointer"
          id="btn-contact-back"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex flex-col items-center select-none leading-none">
          <span className="text-2xl font-sans font-extrabold tracking-tighter text-[#1A1A1A] lowercase leading-none">
            draftsmith
          </span>
          <span className="text-[8px] font-mono tracking-widest text-[#4A4844] mt-1 block leading-none font-medium text-center">
            Support & Inquiry Hub
          </span>
        </div>

        <button 
          onClick={onGoToStudio}
          className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-black text-[11px] font-sans font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm"
          id="btn-contact-studio"
        >
          Open Studio
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6" id="contact-main">
        
        {/* Connection status rail bar */}
        <div className="flex items-center justify-between border-b border-polish-border pb-3">
          <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A]">
            <Mail className="w-4 h-4 text-polish-meta" />
            <span>Direct Author Support Channel</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-polish-meta/80 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Direct Mail Client Tunnel</span>
          </div>
        </div>

        {/* Form and FAQ layout grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 animate-fade-in" id="contact-user-view">
          
          {/* Left Column: FAQ and Solo Dev Note */}
          <section className="md:col-span-6 space-y-6" id="contact-left-column">
            
            {/* Header Introduction */}
            <div className="space-y-2">
              <span className="text-[9px] tracking-[0.2em] font-sans font-bold uppercase text-polish-meta block">Help & Support</span>
              <h2 className="text-3xl font-serif font-bold text-polish-dark tracking-tight leading-tight">
                Inquiry & FAQ Hub
              </h2>
              <p className="text-xs text-polish-text leading-relaxed">
                Find instant answers regarding typographic compliance, browser storage, and compilation rules, or send an inquiry directly to the developer.
              </p>
            </div>

            {/* Warm Solo Dev Statement Box */}
            <div className="p-5 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-3 shadow-2xs relative overflow-hidden" id="solo-dev-notice">
              <div className="absolute top-0 right-0 p-3 text-amber-100 pointer-events-none">
                <Sparkles className="w-10 h-10 stroke-[1]" />
              </div>
              
              <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                <Info className="w-4.5 h-4.5 text-amber-700 shrink-0" />
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-amber-900 animate-pulse">Project Notice & Status</h3>
              </div>
              
              <div className="space-y-2 text-xs text-amber-900 leading-relaxed">
                <p className="font-serif italic font-semibold">
                  &ldquo;I am a solo dev working on this project. Your queries or problems might take some time to fix.&rdquo;
                </p>
                <p className="text-[11px] text-amber-800/90 text-justify">
                  Draftsmith is run and maintained as a solo open-source passion project. Since I do not charge anything for these tools, I review emails, bug reports, and features in my spare evening hours. I greatly appreciate your patience and collaborative spirit!
                </p>
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="space-y-3" id="faq-accordions">
              <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-[#1A1A1A] pb-1 border-b border-polish-border">
                Frequently Asked Questions
              </h3>
              
              <div className="space-y-2">
                {faqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div 
                      key={index}
                      className="bg-polish-paper border border-polish-border rounded-lg overflow-hidden transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="w-full text-left p-3 flex justify-between items-center hover:bg-[#FAF9F5] transition cursor-pointer select-none"
                      >
                        <span className="text-xs font-serif font-bold text-polish-dark pr-3">
                          {faq.question}
                        </span>
                        <span className={`text-[#706E6B] font-mono text-sm shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                          +
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-3 pb-3.5 pt-1 border-t border-polish-border/40 text-[11.5px] leading-relaxed text-polish-text text-justify animate-fade-in bg-[#FAF9F5]/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Right Column: Interactive Inquiry Form with direct mail trigger */}
          <section className="md:col-span-6 bg-polish-paper border border-polish-border rounded-2xl p-6 md:p-8 shadow-sm space-y-4 animate-fade-in" id="contact-right-column">
            <div className="border-b border-polish-border pb-3.5">
              <div className="flex items-center gap-2 text-polish-dark">
                <Mail className="w-4 h-4 text-polish-meta" />
                <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-polish-dark">
                  Send Problem Inquiry
                </h3>
              </div>
              <p className="text-[11px] text-polish-text mt-1">
                Have a suggestion, structural bug, or formatting glitch? Submit a report below.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl space-y-3.5 text-xs leading-relaxed animate-fade-in" id="submit-success-banner">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-sans font-bold block text-sm text-emerald-950">Draft Email Prepared!</strong>
                    <p className="text-emerald-900 mt-0.5 text-justify animate-fade-in">
                      We have launched your device's native email client with your message fully structured and addressed to <strong className="font-bold underline">omparhad4@gmail.com</strong>.
                    </p>
                  </div>
                </div>

                {lastMailtoUrl && (
                  <div className="bg-white border border-emerald-200 p-3.5 rounded-lg space-y-2.5 shadow-3xs">
                    <p className="text-[11px] text-emerald-800 font-medium">
                      If your mail application didn't open automatically, please click the button below:
                    </p>
                    <a
                      href={lastMailtoUrl}
                      className="inline-flex items-center justify-center gap-2 w-full text-center px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-extrabold uppercase tracking-wide text-[10px] rounded-md shadow-xs transition"
                      id="btn-manual-mailto-trigger"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Open Email & Send to omparhad4@gmail.com
                    </a>
                  </div>
                )}
                
                <p className="text-[10px] text-emerald-600 italic mt-1 text-center">
                  Thank you for keeping Draftsmith running!
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex gap-3 text-xs leading-relaxed animate-fade-in" id="submit-error-banner">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-rose-950">Submission Failed</strong>
                  {submitError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo Tolstoy"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark focus:outline-none focus:border-polish-dark transition text-xs"
                />
              </div>

              <div>
                <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. author@novelstudio.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark focus:outline-none focus:border-polish-dark transition text-xs"
                />
              </div>

              <div>
                <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">
                  Topic / Problem Area
                </label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark focus:outline-none focus:border-polish-dark transition text-xs font-sans cursor-pointer"
                >
                  <option value="bug">Structural Bug or Crash</option>
                  <option value="typesetting">Typesetting / Margin Issue</option>
                  <option value="export">PDF Compilation Error</option>
                  <option value="feature">New Feature Proposal</option>
                  <option value="other">General Question / Say Hello</option>
                </select>
              </div>

              <div>
                <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">
                  Subject Heading *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue..."
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark focus:outline-none focus:border-polish-dark transition text-xs"
                />
              </div>

              <div>
                <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">
                  Message Body *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe what happened, steps to reproduce, or detail your inquiry..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark focus:outline-none focus:border-polish-dark transition text-xs font-serif leading-relaxed"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-5 py-3 bg-[#1A1A1A] hover:bg-black text-[11px] font-sans font-bold uppercase tracking-widest rounded-lg text-white transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                id="btn-contact-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Opening your Mail client...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Inquiry to omparhad4@gmail.com
                  </>
                )}
              </button>
            </form>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-polish-paper border-t border-polish-border py-6 px-10 text-center text-xs text-[#706E6B] font-sans flex justify-center items-center" id="contact-footer">
        <span>© {new Date().getFullYear()} omparhad — Crafting Elegant Literary Typography (Open Source)</span>
      </footer>
    </div>
  );
};
