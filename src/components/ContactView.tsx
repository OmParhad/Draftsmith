import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, HelpCircle, Mail, Send, AlertCircle, Info, CheckCircle, 
  MessageSquare, Sparkles, Inbox, Trash2, Search, Filter, Clock, Loader2, User, Globe
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

interface Inquiry {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
  createdAt: string;
  ipAddress?: string;
}

export const ContactView: React.FC<ContactViewProps> = ({ onBackToLanding, onGoToStudio }) => {
  const [form, setForm] = useState<InquiryForm>({
    name: '',
    email: '',
    topic: 'bug',
    subject: '',
    message: '',
  });

  // State managers
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
    return localStorage.getItem('draftsmith_developer_mode') === 'true';
  });
  const [devToast, setDevToast] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'submit' | 'developer'>('submit');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Filter/Search states for Developer Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');

  // Key combination listener to toggle Developer Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Ctrl+Shift+D or Alt+Shift+D, or Cmd+Shift+D
      const isModifier = e.ctrlKey || e.metaKey || e.altKey;
      const isShift = e.shiftKey;
      const isKeyD = e.key.toLowerCase() === 'd';

      if (isModifier && isShift && isKeyD) {
        e.preventDefault();
        setIsDeveloperMode(prev => {
          const nextVal = !prev;
          localStorage.setItem('draftsmith_developer_mode', String(nextVal));
          
          // Clear current active tab if we are disabling dev mode
          if (!nextVal) {
            setActiveTab('submit');
          }

          // Trigger a beautiful visual toast
          setDevToast(nextVal ? "Developer Portal Unlocked! (Secure Inbox Tab Active)" : "Developer Portal Locked. (Secure Inbox Tab Hidden)");
          return nextVal;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Auto-dismiss dev mode toast
  useEffect(() => {
    if (devToast) {
      const timer = setTimeout(() => {
        setDevToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [devToast]);

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

  // Helper to fetch inquiries from our real memory-backed API, with graceful local fallback
  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    // Initial fetch of local inquiries
    const localInqs = JSON.parse(localStorage.getItem('draftsmith_local_inquiries') || '[]');
    
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        const serverInqs = data.inquiries || [];
        
        // Merge server and local inquiries, removing duplicates by id
        const mergedMap = new Map<string, Inquiry>();
        serverInqs.forEach((inq: Inquiry) => mergedMap.set(inq.id, inq));
        localInqs.forEach((inq: Inquiry) => mergedMap.set(inq.id, inq));
        
        const sortedInquiries = Array.from(mergedMap.values()).sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setInquiries(sortedInquiries);
      } else {
        setInquiries(localInqs);
      }
    } catch (e) {
      console.warn("Could not contact the backend for inquiries; fallback to browser localStorage:", e);
      setInquiries(localInqs);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  // Load inquiries when component mounts
  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Prepare a unique fallback inquiry
    const uniqueLocalId = `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fallbackInquiry: Inquiry = {
      id: uniqueLocalId,
      name: form.name,
      email: form.email,
      topic: form.topic,
      subject: form.subject,
      message: form.message,
      createdAt: new Date().toISOString(),
      ipAddress: "Secure Local Sandbox"
    };

    try {
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
        // Refresh inquiries list
        await fetchInquiries();
        setTimeout(() => setSubmitSuccess(false), 8000);
      } else {
        // Fetch failed with non-200, save locally as fallback
        const localInqs = JSON.parse(localStorage.getItem('draftsmith_local_inquiries') || '[]');
        localInqs.unshift(fallbackInquiry);
        localStorage.setItem('draftsmith_local_inquiries', JSON.stringify(localInqs));
        
        setSubmitSuccess(true);
        setForm({
          name: '',
          email: '',
          topic: 'bug',
          subject: '',
          message: '',
        });
        await fetchInquiries();
        setTimeout(() => setSubmitSuccess(false), 8000);
      }
    } catch (err: any) {
      console.warn("Inquiry network error, falling back to writing to browser storage:", err);
      
      // Save locally to local inquiries state as safe fallback
      const localInqs = JSON.parse(localStorage.getItem('draftsmith_local_inquiries') || '[]');
      localInqs.unshift(fallbackInquiry);
      localStorage.setItem('draftsmith_local_inquiries', JSON.stringify(localInqs));
      
      setSubmitSuccess(true);
      setForm({
        name: '',
        email: '',
        topic: 'bug',
        subject: '',
        message: '',
      });
      
      // Refresh list to pick up localStorage items
      await fetchInquiries();
      setTimeout(() => setSubmitSuccess(false), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = (id: string) => {
    // Delete in-memory client-side but also from local storage
    setInquiries(prev => prev.filter(inq => inq.id !== id));
    const localInqs = JSON.parse(localStorage.getItem('draftsmith_local_inquiries') || '[]');
    const updatedLocal = localInqs.filter((inq: Inquiry) => inq.id !== id);
    localStorage.setItem('draftsmith_local_inquiries', JSON.stringify(updatedLocal));
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Filter & Search computation
  const filteredInquiries = inquiries.filter(inq => {
    const matchesTopic = filterTopic === 'all' || inq.topic === filterTopic;
    const searchString = `${inq.name} ${inq.email} ${inq.subject} ${inq.message}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-polish-bg text-polish-dark flex flex-col justify-between font-sans antialiased animate-fade-in relative" id="contact-viewport">
      
      {/* Dev Mode Notification Bubble */}
      {devToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-[#1A1A1A] border border-amber-400 text-amber-400 text-xs font-sans font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2.5 animate-bounce" id="developer-mode-toast">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{devToast}</span>
        </div>
      )}

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
        
        {/* Tab View Selection Bar */}
        <div className="flex items-center justify-between border-b border-polish-border pb-3">
          <div className="flex items-center gap-1.5 bg-[#FAF9F5] p-1 rounded-lg border border-polish-border">
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'submit'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-polish-text hover:text-polish-dark hover:bg-[#F0EEE8]'
              }`}
              id="tab-btn-submit-mode"
            >
              <Mail className="w-3.5 h-3.5" />
              Inquiry Form & FAQs
            </button>
            
            {isDeveloperMode && (
              <button
                onClick={() => {
                  setActiveTab('developer');
                  fetchInquiries();
                }}
                className={`px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-2 relative border border-amber-300/40 ${
                  activeTab === 'developer'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50/40 hover:text-amber-900 hover:bg-[#F5eedc]'
                }`}
                id="tab-btn-developer-mode"
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Real-time Developer Inbox</span>
                {inquiries.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow-xs">
                    {inquiries.length}
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-polish-meta/80 font-mono">
            <span className={`inline-block w-2 h-2 rounded-full ${isDeveloperMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span>{isDeveloperMode ? 'Developer Mode Active' : 'Secure Inbound Connection'}</span>
          </div>
        </div>

        {/* Tab content area */}
        {activeTab === 'submit' ? (
          /* USER FORM AND FAQ GRID SECTION */
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
                  Find instant answers regarding typographic compliance, browser storage, and compilation rules, or send an inquiry to the developer.
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

            {/* Right Column: Interactive Inquiry Form */}
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
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex gap-3 text-xs leading-relaxed animate-fade-in" id="submit-success-banner">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-emerald-950">Inquiry Received and Stored!</strong>
                    Your inquiry has been compiled and saved to the in-memory server list. Switch to the <strong className="font-bold border-b border-dashed border-emerald-800 cursor-pointer" onClick={() => setActiveTab('developer')}>Real-time Dev Inbox</strong> tab above to view your message immediately.
                  </div>
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
                      Uploading Letter to Server...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Inquiry Letter
                    </>
                  )}
                </button>
              </form>
            </section>

          </div>
        ) : (
          /* DEVELOPER ADMIN REAL-TIME INBOX VIEW */
          <div className="bg-white border border-polish-border rounded-2xl p-5 md:p-8 space-y-6 shadow-xs animate-fade-in" id="contact-developer-view">
            
            {/* Inbox header controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-polish-border pb-5">
              <div>
                <span className="text-[9px] tracking-widest bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold uppercase font-sans">
                  Server Storage Logs [In-Memory]
                </span>
                <h3 className="text-xl font-serif font-bold text-polish-dark mt-1">
                  Incoming Inquiry Ticket Room
                </h3>
                <p className="text-xs text-polish-text">
                  This console lists all queries submitted via the 'Support Hub' portal. Real-time updates occur instantly upon submission.
                </p>
              </div>

              <button
                onClick={fetchInquiries}
                disabled={isLoadingInquiries}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F5] border border-polish-border text-[10px] font-sans font-bold uppercase tracking-wider hover:bg-[#F0EEE8] transition rounded-md shadow-2xs cursor-pointer"
                id="btn-refresh-inbox"
              >
                {isLoadingInquiries ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* Filter and Search Bar Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3" id="inbox-search-filter-row">
              {/* Search input */}
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-polish-meta/70" />
                <input
                  type="text"
                  placeholder="Search inquiries by sender, email, subject keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-polish-dark transition text-polish-dark placeholder:text-polish-meta/50"
                  id="inbox-search-input"
                />
              </div>

              {/* Topic Select filter */}
              <div className="md:col-span-4 relative flex items-center">
                <Filter className="absolute left-3 w-3.5 h-3.5 text-polish-meta/80 pointer-events-none" />
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-polish-dark font-sans cursor-pointer text-polish-dark"
                  id="inbox-filter-select"
                >
                  <option value="all">All Incident Topics</option>
                  <option value="bug">Structural Bug or Crash</option>
                  <option value="typesetting">Typesetting / Margin Issue</option>
                  <option value="export">PDF Compilation Error</option>
                  <option value="feature">New Feature Proposal</option>
                  <option value="other">General Question / Greetings</option>
                </select>
              </div>
            </div>

            {/* Inquiry tickets representation */}
            {isLoadingInquiries ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-polish-dark animate-spin" />
                <p className="text-xs text-polish-meta">Synchronizing live tickets with our Node memory storage...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-polish-border/60 bg-neutral-50/50 rounded-xl space-y-2">
                <Inbox className="w-10 h-10 text-polish-meta/40 mx-auto" strokeWidth={1} />
                <h4 className="text-xs font-sans font-bold uppercase text-polish-meta">No Inquiries Found</h4>
                <p className="text-[11px] text-polish-meta/85 max-w-sm mx-auto">
                  No tickets matched your filter selection or search terms. Submit a new message in the 'Inquiry Form' tab to see it generated here!
                </p>
              </div>
            ) : (
              <div className="space-y-4" id="inquiry-list-items">
                {filteredInquiries.map((inq) => {
                  // Category label style helper
                  const getTopicStyle = (topic: string) => {
                    switch (topic) {
                      case 'bug':
                        return 'text-rose-700 bg-rose-50 border-rose-200';
                      case 'typesetting':
                        return 'text-blue-700 bg-blue-50 border-blue-200';
                      case 'export':
                        return 'text-amber-700 bg-amber-50 border-amber-200';
                      case 'feature':
                        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
                      default:
                        return 'text-neutral-700 bg-neutral-100 border-neutral-200';
                    }
                  };

                  return (
                    <div 
                      key={inq.id}
                      className="bg-[#FAF9F5]/40 border border-polish-border rounded-xl p-4 md:p-5 flex flex-col space-y-3.5 hover:border-polish-dark/50 transition-colors"
                    >
                      {/* Ticket top context line */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-sans font-extrabold uppercase px-2.5 py-0.5 rounded border ${getTopicStyle(inq.topic)}`}>
                            {inq.topic === 'bug' ? 'Bug Report' : inq.topic === 'typesetting' ? 'Typesetting' : inq.topic === 'export' ? 'PDF Export' : inq.topic === 'feature' ? 'Proposal' : 'Query'}
                          </span>
                          <span className="text-[10px] font-mono text-polish-meta/70">
                            ID: {inq.id}
                          </span>
                        </div>

                        {/* Date and actions */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] text-polish-meta">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(inq.createdAt).toLocaleString()}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteInquiry(inq.id)}
                            className="p-1 hover:bg-rose-50 text-polish-meta hover:text-rose-600 rounded transition cursor-pointer"
                            title="Remove ticket log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ticket core content */}
                      <div className="space-y-1 bg-white border border-polish-border/40 p-4 rounded-lg shadow-2xs">
                        <h4 className="text-sm font-serif font-bold text-polish-dark leading-snug">
                          {inq.subject}
                        </h4>
                        <p className="text-xs text-polish-dark font-serif italic text-justify leading-relaxed whitespace-pre-wrap pt-1 border-t border-polish-border/20 mt-2">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      </div>

                      {/* Author metadata line */}
                      <div className="flex flex-wrap items-center justify-between pt-1 border-t border-polish-border/20 text-[11px] text-polish-text">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1.5 font-sans font-bold text-[#1A1A1A]">
                            <User className="w-3.5 h-3.5 text-polish-meta/80" />
                            {inq.name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-polish-meta/80" />
                            <a href={`mailto:${inq.email}`} className="hover:underline hover:text-polish-dark font-mono font-medium">{inq.email}</a>
                          </span>
                        </div>

                        {inq.ipAddress && (
                          <div className="flex items-center gap-1 text-[10px] text-polish-meta font-mono bg-[#F0EEE8] px-2 py-0.5 rounded border border-polish-border/45 select-all">
                            <Globe className="w-3 h-3 text-polish-meta/60" />
                            <span>IP: {inq.ipAddress}</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-polish-paper border-t border-polish-border py-6 px-10 text-center text-xs text-[#706E6B] font-sans flex justify-center items-center" id="contact-footer">
        <span>© {new Date().getFullYear()} omparhad — Crafting Elegant Literary Typography (Open Source)</span>
      </footer>
    </div>
  );
};
