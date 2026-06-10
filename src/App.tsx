import { useState, useMemo, useEffect, FormEvent, MouseEvent, ChangeEvent } from 'react';
import { initialChapters, originalStoryTitle } from './storyData';
import { ManuscriptConfig, Novel } from './types';
import { BookViewer } from './components/BookViewer';
import { EditorView } from './components/EditorView';
import { PdfExporter } from './components/PdfExporter';
import { paginateManuscript } from './utils/paginator';
import { 
  BookOpen, 
  Settings, 
  PenTool, 
  Download, 
  Check, 
  Sliders, 
  Layers, 
  Award,
  BookMarked,
  Sparkles,
  Info,
  Plus,
  Trash2,
  ArrowRight,
  ExternalLink,
  Globe,
  FileCode,
  ArrowLeft,
  Upload,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Github
} from 'lucide-react';
import { WalkthroughPreview } from './components/WalkthroughPreview';

const DEFAULT_NOVEL: Novel = {
  id: 'edward',
  title: "THE JOURNEY OF EDWARD",
  config: {
    title: "THE JOURNEY OF EDWARD",
    subtitle: "the summer hunting",
    authorName: "Edward Hound",
    authorLastName: "HOUND",
    shortTitle: "THE SUMMER HUNTING",
    fontFamily: "times",
    lineSpacing: 1.5,
    fontSize: 12,
    letterSpacing: "normal",
    marginSize: "standard",
    pageSize: "letter",
    paperColor: "cream",
    chapterDesign: "classic",
  },
  chapters: initialChapters,
};

export default function App() {
  // 1. Core State
  const [novels, setNovels] = useState<Novel[]>(() => {
    const saved = localStorage.getItem('manuscript_novels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [DEFAULT_NOVEL]; // Pre-populate with standard sample novel for a perfect first-load impression
  });

  // Navigation mode transitions between Landing view and Studio Workspace
  const [viewMode, setViewMode] = useState<'landing' | 'studio'>(() => {
    const savedMode = localStorage.getItem('manuscript_view_mode');
    return (savedMode as 'landing' | 'studio') || 'landing';
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'export'>('preview');
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSetViewMode = (mode: 'landing' | 'studio') => {
    setViewMode(mode);
    localStorage.setItem('manuscript_view_mode', mode);
  };

  // GitHub Pages deployment URL
  const [ghPagesUrl, setGhPagesUrl] = useState<string>(() => {
    return localStorage.getItem('manuscript_gh_pages_url') || 'https://omparhad.github.io/draftsmith';
  });

  const handleSaveGhPagesUrl = (url: string) => {
    const cleanUrl = url.trim();
    setGhPagesUrl(cleanUrl);
    localStorage.setItem('manuscript_gh_pages_url', cleanUrl);
  };

  // Local Backup and Restore status alert for offline & cache safety
  const [backupStatus, setBackupStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(novels));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `draftsmith_full_library_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupStatus({ message: "Full Library backup downloaded! Keep this file safe.", type: 'success' });
      setTimeout(() => setBackupStatus(null), 6000);
    } catch (e) {
      setBackupStatus({ message: "Could not compile download backup file.", type: 'error' });
      setTimeout(() => setBackupStatus(null), 5000);
    }
  };

  const handleImportBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isValid = parsed.every(n => typeof n.id === 'string' && typeof n.title === 'string' && Array.isArray(n.chapters));
            if (isValid) {
              setNovels(parsed);
              const first = parsed[0];
              setActiveNovelId(first.id);
              setChapters(first.chapters);
              setConfig(first.config);
              localStorage.setItem('manuscript_active_novel_id', first.id);
              localStorage.setItem('manuscript_novels', JSON.stringify(parsed));
              setBackupStatus({ message: "Outstanding! All manuscripts restored successfully.", type: 'success' });
            } else {
              setBackupStatus({ message: "Unsupported backup structure. Needs to be a valid Draftsmith file.", type: 'error' });
            }
          } else {
            setBackupStatus({ message: "The loaded collection is empty or invalid.", type: 'error' });
          }
        } catch (err) {
          setBackupStatus({ message: "Error parsing json workspace file.", type: 'error' });
        }
        setTimeout(() => setBackupStatus(null), 6000);
      };
    }
  };

  const [activeNovelId, setActiveNovelId] = useState<string>(() => {
    const savedId = localStorage.getItem('manuscript_active_novel_id');
    return savedId || '';
  });

  const activeNovel = useMemo(() => {
    return novels.find(n => n.id === activeNovelId) || novels[0] || null;
  }, [novels, activeNovelId]);

  const [chapters, setChapters] = useState<typeof initialChapters>([]);
  const [config, setConfig] = useState<ManuscriptConfig>({
    title: "",
    subtitle: "",
    authorName: "",
    authorLastName: "",
    shortTitle: "",
    fontFamily: "times",
    lineSpacing: 1.5,
    fontSize: 12,
    letterSpacing: "normal",
    marginSize: "standard",
    pageSize: "letter",
    paperColor: "cream",
    chapterDesign: "classic",
  });

  // State for debounced compilation specifically to prevent editor lag and page jumping
  const [paginatedChapters, setPaginatedChapters] = useState<typeof initialChapters>([]);
  const [paginatedConfig, setPaginatedConfig] = useState<ManuscriptConfig>({
    title: "",
    subtitle: "",
    authorName: "",
    authorLastName: "",
    shortTitle: "",
    fontFamily: "times",
    lineSpacing: 1.5,
    fontSize: 12,
    letterSpacing: "normal",
    marginSize: "standard",
    pageSize: "letter",
    paperColor: "cream",
    chapterDesign: "classic",
  });

  // Keep state in sync with loaded active novel ONLY when activeNovelId changes
  useEffect(() => {
    if (activeNovel) {
      setChapters(activeNovel.chapters);
      setConfig(activeNovel.config);
      setPaginatedChapters(activeNovel.chapters);
      setPaginatedConfig(activeNovel.config);
      if (activeNovel.id !== activeNovelId) {
        setActiveNovelId(activeNovel.id);
        localStorage.setItem('manuscript_active_novel_id', activeNovel.id);
      }
    } else {
      setChapters([]);
      setConfig({
        title: "",
        subtitle: "",
        authorName: "",
        authorLastName: "",
        shortTitle: "",
        fontFamily: "times",
        lineSpacing: 1.5,
        fontSize: 12,
        letterSpacing: "normal",
        marginSize: "standard",
        pageSize: "letter",
        paperColor: "cream",
        chapterDesign: "classic",
      });
      setPaginatedChapters([]);
      setPaginatedConfig({
        title: "",
        subtitle: "",
        authorName: "",
        authorLastName: "",
        shortTitle: "",
        fontFamily: "times",
        lineSpacing: 1.5,
        fontSize: 12,
        letterSpacing: "normal",
        marginSize: "standard",
        pageSize: "letter",
        paperColor: "cream",
        chapterDesign: "classic",
      });
      setActiveNovelId('');
      localStorage.removeItem('manuscript_active_novel_id');
    }
  }, [activeNovelId]);

  // Switch between novels cleanly
  const handleSwitchNovel = (id: string) => {
    // Save current active state before switching
    const updatedNovels = novels.map(n => {
      if (n.id === activeNovelId) {
        return { ...n, chapters, config, title: config.title };
      }
      return n;
    });

    const target = updatedNovels.find(n => n.id === id);
    if (target) {
      setNovels(updatedNovels);
      setActiveNovelId(id);
      setChapters(target.chapters);
      setConfig(target.config);
      setPaginatedChapters(target.chapters);
      setPaginatedConfig(target.config);
      localStorage.setItem('manuscript_active_novel_id', id);
      localStorage.setItem('manuscript_novels', JSON.stringify(updatedNovels));
    }
  };

  // Debounce updates to the typesetter during active typing to keep input butter-smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaginatedChapters(chapters);
      setPaginatedConfig(config);
    }, 600); // 600ms debounce of paginator compilation

    return () => clearTimeout(timer);
  }, [chapters, config]);

  // Instantly synchronize pages when the user switches to the previewer or compiler tab
  useEffect(() => {
    if (activeTab === 'preview' || activeTab === 'export') {
      setPaginatedChapters(chapters);
      setPaginatedConfig(config);
    }
  }, [activeTab]);

  // Auto-save the active state to localStorage / novels state
  useEffect(() => {
    if (!activeNovelId || !activeNovel) return; // Guard
    const timer = setTimeout(() => {
      setNovels(prev => {
        const updated = prev.map(n => {
          if (n.id === activeNovelId) {
            return {
              ...n,
              title: config.title || n.title,
              chapters,
              config
            };
          }
          return n;
        });
        localStorage.setItem('manuscript_novels', JSON.stringify(updated));
        return updated;
      });
    }, 500); // debounce slightly
    return () => clearTimeout(timer);
  }, [chapters, config, activeNovelId, activeNovel]);

  // Form states for creating a new novel inline
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNovelTitle, setNewNovelTitle] = useState('');
  const [newNovelSubtitle, setNewNovelSubtitle] = useState('');
  const [newNovelAuthor, setNewNovelAuthor] = useState('');

  const handleAddNewNovel = (e: FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle.trim()) return;

    const title = newNovelTitle.trim();
    const subtitle = newNovelSubtitle.trim() || "Volume I";
    const author = newNovelAuthor.trim() || "Unknown Author";

    const authorLast = author.split(/\s+/).pop()?.toUpperCase() || "AUTHOR";
    const shortT = title.toUpperCase().slice(0, 24);

    const newNovel: Novel = {
      id: `novel_${Date.now()}`,
      title: title,
      config: {
        title: title,
        subtitle: subtitle,
        authorName: author,
        authorLastName: authorLast,
        shortTitle: shortT,
        fontFamily: "times",
        lineSpacing: 1.5,
        fontSize: 12,
        letterSpacing: "normal",
        marginSize: "standard",
        pageSize: "letter",
        paperColor: "cream",
        chapterDesign: "classic",
      },
      chapters: [
        {
          id: `chap_${Date.now()}_1`,
          number: "CHAPTER ONE",
          title: "The Opening Chapter",
          content: `In the quiet expanse of the room, the blank sheets of parchment sat like white sails waiting for a wind. Here begins the new manuscript chronicle.\n\nEdit this draft standard to construct chapter flows, margins, and type specifications.`
        }
      ]
    };

    const updated = [...novels, newNovel];
    setNovels(updated);
    setActiveNovelId(newNovel.id);
    setChapters(newNovel.chapters);
    setConfig(newNovel.config);
    localStorage.setItem('manuscript_active_novel_id', newNovel.id);
    localStorage.setItem('manuscript_novels', JSON.stringify(updated));

    // Reset form
    setNewNovelTitle('');
    setNewNovelSubtitle('');
    setNewNovelAuthor('');
    setShowAddForm(false);
  };

  const handleDeleteNovel = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${novels.find(n => n.id === id)?.title}"?`)) {
      const remaining = novels.filter(n => n.id !== id);
      setNovels(remaining);
      if (activeNovelId === id) {
        const nextActive = remaining[0] || null;
        if (nextActive) {
          setActiveNovelId(nextActive.id);
          setChapters(nextActive.chapters);
          setConfig(nextActive.config);
          localStorage.setItem('manuscript_active_novel_id', nextActive.id);
        } else {
          setActiveNovelId('');
          setChapters([]);
          setConfig({
            title: "",
            subtitle: "",
            authorName: "",
            authorLastName: "",
            shortTitle: "",
            fontFamily: "times",
            lineSpacing: 1.5,
            fontSize: 12,
            letterSpacing: "normal",
            marginSize: "standard",
            pageSize: "letter",
            paperColor: "cream",
            chapterDesign: "classic",
          });
          localStorage.removeItem('manuscript_active_novel_id');
        }
      }
      localStorage.setItem('manuscript_novels', JSON.stringify(remaining));
    }
  };

  // 2. Memoized Pagination (Using debounced inputs to avoid laggy keystrokes & flickering)
  const pages = useMemo(() => {
    if (!activeNovel || !paginatedConfig) return [];
    return paginateManuscript(paginatedChapters, paginatedConfig);
  }, [paginatedChapters, paginatedConfig, activeNovel]);

  // Total words calculation
  const totalWords = useMemo(() => {
    return chapters.reduce((acc, chap) => {
      const words = chap.content.trim().split(/\s+/);
      return acc + (words[0] === '' ? 0 : words.length);
    }, 0);
  }, [chapters]);

  // Restore Default Chapters
  const handleRestoreOriginal = () => {
    if (activeNovelId === 'edward') {
      setChapters(initialChapters);
    } else {
      setChapters([
        {
          id: `chap_${Date.now()}_empty`,
          number: "CHAPTER ONE",
          title: "The Opening Chapter",
          content: "In the quiet expanse of the room, the blank sheets of parchment sat like white sails waiting for a wind."
        }
      ]);
    }
  };

  // 1. Landing Hub View Option (Homepage which leads directly to their GitHub pages)
  if (viewMode === 'landing') {
    const slides = [
      {
        title: "1. No Active Manuscript Setup",
        description: "Initialize your manuscript with custom book-building guidelines. Craft your Novel Title, Volume/Subtitle, and Author credentials to begin.",
        image: "/src/assets/images/typeset_init_1781078908277.png"
      },
      {
        title: "2. Absolute Page Sheet Preview",
        description: "Align margins (Standard, narrow, wide) with physical Letter/A4 coordinates. Read, paginate, and track running headers in standard Garamond/Times structures.",
        image: "/src/assets/images/typeset_preview_1781078930206.png"
      },
      {
        title: "3. Direct Chapters Manager",
        description: "Add, delete, or rearrange chapters inside your workspace. Real-time per-chapter and cumulative word indicators ensure you track every milestone.",
        image: "/src/assets/images/typeset_editor_1781078946113.png"
      },
      {
        title: "4. Exquisite PDF Export Engine",
        description: "Download double-spaced, publisher-grade, print-ready manuscripts instantly. Perfect alignment with no overlapping margins, custom page numbering, and clean dividers.",
        image: "/src/assets/images/typeset_export_1781078962159.png"
      }
    ];

    return (
      <div className="min-h-screen bg-polish-bg text-polish-dark flex flex-col justify-between font-sans antialiased animate-fade-in" id="landing-viewport">
        {/* Fixed Header */}
        <header className="bg-polish-paper border-b border-polish-border px-6 md:px-10 py-4.5 sticky top-0 z-50 flex items-center justify-between shadow-sm" id="landing-header">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-polish-dark text-polish-paper rounded">
              <BookMarked className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-cormorant font-bold tracking-wide text-polish-dark">
              Draftsmith
            </h1>
          </div>
          <button 
            onClick={() => handleSetViewMode('studio')}
            className="px-4 py-2 bg-polish-dark text-polish-paper hover:bg-black text-[11px] font-sans font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-2"
            id="landing-header-btn-studio"
          >
            Open Studio <ArrowRight className="w-4 h-4" />
          </button>
        </header>

        {/* Hero & Interactive Documentation Dashboard Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-16" id="landing-main">
          
          {/* Aesthetic Hero Section */}
          <section className="text-center max-w-3xl mx-auto space-y-6 pt-4" id="landing-hero">
            <span className="text-[10px] tracking-[0.25em] font-sans font-bold uppercase text-polish-meta block">A Free Open Source Studio for Novelists</span>
            <h2 className="text-4xl md:text-6xl font-cormorant font-bold text-polish-dark tracking-tight leading-none">
              Craft. Page. Compile.
            </h2>
            <p className="text-sm md:text-base text-polish-text leading-relaxed font-serif max-w-2xl mx-auto">
              Draftsmith is a professional, completely open-source typography studio for novelists. Compile your chapters into publisher-ready manuscripts, typeset margins, and paginate your writing instantly for free.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleSetViewMode('studio')}
                className="px-6 py-3.5 bg-polish-dark text-polish-paper hover:bg-black font-sans font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                Launch Writing Studio <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://github.com/omparhad/Draftsmith"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-polish-paper border border-[#1A1A1A] text-polish-dark hover:bg-[#1A1A1A] hover:text-white font-sans font-bold uppercase tracking-wider text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Github className="w-4 h-4 shrink-0" /> GitHub Source
              </a>
            </div>
          </section>

          {/* Interactive Walkthrough Slideshow Section */}
          <section className="bg-polish-paper border border-polish-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6" id="tour-slideshow">
            <div className="text-center md:text-left border-b border-polish-border pb-4 max-w-2xl">
              <span className="text-[10px] tracking-[0.2em] font-sans font-bold uppercase text-polish-meta block mb-1">Interactive Studio Walkthrough</span>
              <h3 className="text-2xl font-serif font-bold text-polish-dark">
                Take a Visual Tour of Draftsmith
              </h3>
              <p className="text-xs text-polish-text mt-1">
                Explore how Draftsmith converts raw text and custom metrics into authentic, typeset book manuscripts ready for publisher review or direct print.
              </p>
            </div>

            {/* Slider container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF9F5] p-5 md:p-6 rounded-xl border border-polish-border/80">
              
              {/* Left Column: Visual description & controls */}
              <div className="lg:col-span-4 space-y-4 flex flex-col justify-between h-full py-2">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[9px] font-sans font-bold text-amber-800 uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" /> Stage active {currentSlide + 1} of 4
                  </span>
                  
                  <h4 className="text-base font-serif font-bold text-polish-dark leading-snug">
                    {slides[currentSlide].title}
                  </h4>
                  
                  <p className="text-xs text-polish-text leading-relaxed">
                    {slides[currentSlide].description}
                  </p>
                </div>

                {/* Micro Thumbnail indicators to click and switch */}
                <div className="pt-4 border-t border-polish-border space-y-2">
                  <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-polish-meta">
                    Jump to workspace view:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {slides.map((slide, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`aspect-video rounded border text-[9px] font-bold overflow-hidden transition-all duration-150 flex flex-col items-center justify-center p-1 relative gap-1 cursor-pointer group ${
                          currentSlide === idx
                            ? 'border-polish-dark bg-white ring-2 ring-polish-dark/10 text-polish-dark font-black shadow-sm'
                            : 'border-polish-border bg-[#F5F2EB]/40 hover:border-polish-dark/50 hover:bg-white text-polish-meta hover:text-polish-dark'
                        }`}
                        title={slide.title}
                      >
                        {idx === 0 && <Plus className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />}
                        {idx === 1 && <BookOpen className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />}
                        {idx === 2 && <PenTool className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />}
                        {idx === 3 && <Download className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />}
                        <span className="font-sans font-bold text-[8px] uppercase tracking-wider block">
                          {idx === 0 ? "INIT" : idx === 1 ? "FORMAT" : idx === 2 ? "EDITOR" : "EXPORT"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Left/Right Action controls */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? 3 : prev - 1))}
                    className="p-2 bg-[#FAF9F5] border border-polish-border hover:bg-black/5 text-[#1A1A1A] rounded-lg cursor-pointer transition-colors shadow-sm flex-1 flex items-center justify-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev === 3 ? 0 : prev + 1))}
                    className="p-2 bg-polish-dark text-polish-paper hover:bg-black rounded-lg cursor-pointer transition-colors shadow-sm flex-1 flex items-center justify-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Dynamic large image with device mock layout bezel */}
              <div className="lg:col-span-8 bg-white border border-polish-border rounded-xl p-2 md:p-3 shadow-md border-polish-border hover:shadow-lg transition-shadow duration-300 relative group overflow-hidden">
                <div className="bg-[#F0EEE8]/60 px-3 py-1.5 border-b border-polish-border flex items-center justify-between font-sans text-[10px] text-[#706E6B] rounded-t-lg mb-2 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                    <span className="ml-1.5 font-mono text-[9px] text-[#706E6B]/80 select-all font-semibold select-none">draftsmith.studio/{currentSlide === 0 ? "new" : currentSlide === 1 ? "preview" : currentSlide === 2 ? "editor" : "export"}</span>
                  </div>
                  <span className="font-sans font-bold tracking-wider text-[9px] text-polish-meta uppercase">
                    STUDIO VIEW
                  </span>
                </div>
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded bg-[#FAF9F5] border border-polish-border/40 select-none">
                  <WalkthroughPreview slideIndex={currentSlide} />
                  {/* Floating badge */}
                  <span className="absolute bottom-3 right-3 bg-polish-dark/90 backdrop-blur-xs text-white text-[8px] font-sans font-extrabold px-2 py-1 rounded uppercase tracking-[0.15em] select-none shadow-sm">
                    {currentSlide === 0 ? "INIT SCREEN" : currentSlide === 1 ? "LIVE FORMAT" : currentSlide === 2 ? "CHAPTERS WORK" : "EXPORT PDF"}
                  </span>
                </div>
              </div>

            </div>
          </section>



          {/* Why Draftsmith Comparison Section */}
          <section id="comparison-section" className="bg-polish-paper border border-polish-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8 scroll-mt-24">
            <div className="border-b border-polish-border pb-4 max-w-2xl">
              <span className="text-[10px] tracking-[0.2em] font-sans font-bold uppercase text-polish-meta block mb-1">Open Source & Privacy First</span>
              <h3 className="text-2xl font-serif font-bold text-polish-dark">
                Why Draftsmith Over Popular Writing Software?
              </h3>
              <p className="text-xs text-polish-text mt-1">
                A simple comparison highlighting why novelists prefer a dedicated, light-weight, open-source typesetting workspace over bloated publishing managers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#FAF9F5] border border-polish-border rounded-xl p-5 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <span className="text-amber-800 text-xs font-serif font-bold">1</span>
                </div>
                <h4 className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-polish-dark">Automated Typesetting</h4>
                <p className="text-[11px] leading-relaxed text-polish-text">
                  <strong>The Word Processor Wrestle:</strong> MS Word and Docs keep margins reflowable, demanding constant manual page indenting, header adjustments, and line breaks that often break mid-draft.
                </p>
                <div className="text-[11px] leading-relaxed text-green-900 bg-green-50/50 p-2.5 rounded border border-green-200/50 font-sans">
                  <strong>Draftsmith Cure:</strong> Direct print-sheet container rendering mapping Garamond/Times structures, setting standard running headers instantly as you type.
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FAF9F5] border border-polish-border rounded-xl p-5 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <span className="text-emerald-800 text-xs font-serif font-bold">2</span>
                </div>
                <h4 className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-polish-dark">100% Open Source & Free</h4>
                <p className="text-[11px] leading-relaxed text-polish-text">
                  <strong>The Premium Paywall:</strong> Heavy literary managers (Scrivener, Ulysses) demand high licensing charges, platform-locked files, or recurring monthly subscriptions.
                </p>
                <div className="text-[11px] leading-relaxed text-green-900 bg-green-50/50 p-2.5 rounded border border-green-200/50 font-sans">
                  <strong>Draftsmith Cure:</strong> Standard open-source license. Host your own fork, distribute, and read the code anytime. Free forever for the writing community.
                </div>
              </div>

              {/* Feature- 3 */}
              <div className="bg-[#FAF9F5] border border-polish-border rounded-xl p-5 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center">
                  <span className="text-sky-800 text-xs font-serif font-bold">3</span>
                </div>
                <h4 className="font-sans font-extrabold text-[11px] uppercase tracking-wider text-polish-dark">Zero-Cloud, Absolute Privacy</h4>
                <p className="text-[11px] leading-relaxed text-polish-text">
                  <strong>The Workspace Leaks:</strong> Clunky online apps force automated synchronization. Your manuscript draft is stashed on third-party cloud engines, exposed or collected for data modeling.
                </p>
                <div className="text-[11px] leading-relaxed text-green-900 bg-green-50/50 p-2.5 rounded border border-green-200/50 font-sans">
                  <strong>Draftsmith Cure:</strong> Data resides in your browser's partition memory buffer. No accounts, no credentials, no surveillance. Your words remain yours always.
                </div>
              </div>
            </div>

            {/* Quick Comparison Table */}
            <div className="border border-polish-border rounded-xl overflow-hidden bg-white text-xs shadow-sm">
              <div className="bg-[#FAF9F5] px-4 py-3 border-b border-polish-border flex items-center justify-between font-sans">
                <span className="text-[10px] font-bold uppercase tracking-wider text-polish-dark">Modern Writing Feature Comparison</span>
                <span className="font-mono text-[9px] text-[#706E6B] font-bold bg-[#FAF9F5] px-2 py-0.5 rounded border border-polish-border">FREE SOFTWARE MODEL</span>
              </div>
              <div className="divide-y divide-polish-border/60">
                <div className="grid grid-cols-4 px-4 py-2.5 bg-[#FAF9F5]/40 text-[10px] font-bold uppercase tracking-wider text-polish-meta">
                  <div>Capability</div>
                  <div>MS Word / Docs</div>
                  <div>Scrivener</div>
                  <div className="text-polish-dark font-extrabold">Draftsmith</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 items-center">
                  <div className="font-semibold text-polish-dark">Printer Margin Sheet</div>
                  <div className="text-red-700">Manual (Complex)</div>
                  <div className="text-amber-800">Only compiled</div>
                  <div className="text-green-800 font-semibold flex items-center gap-1">✓ Automated Page Sheet</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 items-center">
                  <div className="font-semibold text-polish-dark">Manuscript Exporter</div>
                  <div className="text-polish-text">Reflowable Export</div>
                  <div className="text-polish-text">Complex Setup Dialogue</div>
                  <div className="text-green-800 font-semibold flex items-center gap-1">✓ 1-Click Double-Spaced PDF</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 items-center">
                  <div className="font-semibold text-polish-dark">Cost & Licensing</div>
                  <div className="text-polish-text">Paid subscription</div>
                  <div className="text-polish-text">Upfront premium buy</div>
                  <div className="text-green-800 font-semibold flex items-center gap-1">✓ Open Source & 100% Free</div>
                </div>
                <div className="grid grid-cols-4 px-4 py-3 items-center">
                  <div className="font-semibold text-polish-dark">Privacy Guard</div>
                  <div className="text-amber-800">Cloud Host Locked</div>
                  <div className="text-polish-text">Offline files</div>
                  <div className="text-green-800 font-semibold flex items-center gap-1">✓ Entirely Client-Side Buffer</div>
                </div>
              </div>
            </div>
          </section>

          {/* Minimalist Feature Matrix Showcase */}
          <section className="space-y-6" id="landing-features">
            <span className="text-[10px] tracking-[0.2em] font-sans font-bold uppercase text-polish-meta block text-center">Bespoke Architectural Capabilities</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-2">
                <div className="w-9 h-9 rounded bg-[#F0EEE8] flex items-center justify-center border border-polish-border/40">
                  <PenTool className="w-4 h-4 text-polish-dark" />
                </div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">1. Standard Chapters Editor</h4>
                <p className="text-[11px] text-polish-text leading-relaxed">
                  Interactive editing workspace with real-time text-aligning buffers, precise inline word estimators, and instant local session storage preservation.
                </p>
              </div>

              <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-2">
                <div className="w-9 h-9 rounded bg-[#F0EEE8] flex items-center justify-center border border-polish-border/40">
                  <Sliders className="w-4 h-4 text-polish-dark" />
                </div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">2. Typeset Pagination Matrix</h4>
                <p className="text-[11px] text-polish-text leading-relaxed">
                  Instantly preview margins (Narrow, Standard, Wide), standard layouts (Letter, A4 sizes), and classic fonts like Garamond alongside running headers with your last name.
                </p>
              </div>

              <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-2">
                <div className="w-9 h-9 rounded bg-[#F0EEE8] flex items-center justify-center border border-polish-border/40">
                  <Download className="w-4 h-4 text-polish-dark" />
                </div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">3. Double-Spaced PDF Exporter</h4>
                <p className="text-[11px] text-polish-text leading-relaxed">
                  Export double-spaced publisher submissions and typesetting sets seamlessly using client-side jspdf libraries with automated page indexes and layout bounds.
                </p>
              </div>

              <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-2">
                <div className="w-9 h-9 rounded bg-[#F0EEE8] flex items-center justify-center border border-polish-border/40">
                  <FileCode className="w-4 h-4 text-polish-dark" />
                </div>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">4. PDF & Plain-Text Importer</h4>
                <p className="text-[11px] text-polish-text leading-relaxed">
                  Feed existing plain text files, markdown content, or PDF formats to deconstruct them, divide them into chapter matrices, and format them beautifully.
                </p>
              </div>

            </div>
          </section>

        </main>

        {/* Home Footer */}
        <footer className="bg-polish-paper border-t border-polish-border py-6 px-10 text-center text-xs text-[#706E6B] font-sans flex justify-center items-center" id="landing-footer">
          <span>© {new Date().getFullYear()} omparhad — Crafting Elegant Literary Typography (Open Source)</span>
        </footer>
      </div>
    );
  }

  // 2. Return Standard Studio Workspace
  return (
    <div className="min-h-screen bg-polish-bg text-polish-dark flex flex-col justify-between font-sans antialiased animate-fade-in" id="applet-viewport">
      
      {/* Premium Studio Header in Professional Polish Style */}
      <header className="bg-polish-paper border-b border-polish-border px-6 md:px-10 py-5 sticky top-0 z-50 flex flex-col sm:flex-row sm:items-end justify-between gap-4" id="applet-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-polish-meta font-sans font-bold">A Free Studio for Novelists</p>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-1 h-1 rounded-full bg-green-600 animate-pulse"></span>
              <span className="text-[9px] font-sans font-bold text-green-800 uppercase tracking-wider">Autosave Active</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-polish-dark text-polish-paper rounded">
              <BookMarked className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-cormorant font-semibold tracking-wide text-polish-dark">
              Draftsmith
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSetViewMode('landing')}
            className="flex items-center gap-2 px-4 py-2 bg-[#FAF9F5] border border-polish-border text-xs font-sans font-bold uppercase tracking-wider text-polish-dark hover:bg-[#F0EEE8] rounded-lg transition-all cursor-pointer shadow-sm"
            id="btn-return-home-hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home & Deploy Hub
          </button>
        </div>
      </header>

      {/* Main Container Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="applet-body-stage">
        
        {/* Left Side: Layout Config Deck */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-28" id="sidebar-container">
          
          {/* Novel Library Selection Panel */}
          <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-4 shadow-sm" id="sidebar-novel-library">
            <div className="flex items-center justify-between border-b border-polish-border pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-polish-text" />
                <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">Novel Library</h2>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1 px-2 text-[10px] uppercase tracking-wider font-bold bg-[#1A1A1A] text-[#F9F7F2] rounded hover:bg-black transition-all flex items-center gap-1 cursor-pointer"
                id="btn-toggle-add-novel"
              >
                <Plus className="w-3 h-3" /> {showAddForm ? 'View' : 'Add'}
              </button>
            </div>

            {/* List / select dropdown */}
            {!showAddForm ? (
              <div className="space-y-3 text-xs">
                {novels.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-2">Active Manuscript</label>
                      <div className="relative">
                        <select
                          value={activeNovelId}
                          onChange={(e) => handleSwitchNovel(e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-sm focus:outline-none focus:border-polish-dark focus:ring-1 focus:ring-polish-dark appearance-none cursor-pointer pr-8"
                          id="select-active-novel"
                        >
                          {novels.map(n => (
                            <option key={n.id} value={n.id}>
                              {n.title.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-polish-text">
                          <Sliders className="w-3.5 h-3.5 opacity-60" />
                        </div>
                      </div>
                    </div>

                    {/* Show details & dynamic delete button of other novels */}
                    <div className="pt-2 space-y-2 border-t border-dashed border-polish-border mt-3">
                      <p className="text-[10px] text-polish-meta font-sans font-bold uppercase tracking-wider">Your Portfolio Volumes</p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1" id="portfolio-list">
                        {novels.map(n => {
                          const isActive = n.id === activeNovelId;
                          return (
                            <div 
                              key={n.id}
                              onClick={() => !isActive && handleSwitchNovel(n.id)}
                              className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                                isActive 
                                  ? 'bg-[#F0EEE8] border-polish-border text-[#1A1A1A] font-bold shadow-sm' 
                                  : 'bg-[#FAF9F5]/40 border-transparent hover:bg-[#F0EEE8]/40 hover:border-polish-border text-[var(--color-polish-text)]'
                              }`}
                            >
                              <div className="truncate flex-1 pr-2">
                                <p className="text-[11px] font-serif truncate">{n.title}</p>
                                <p className="text-[9px] font-sans text-polish-meta uppercase tracking-wider font-semibold">{n.config.authorName}</p>
                              </div>
                              <button
                                onClick={(e) => handleDeleteNovel(n.id, e)}
                                className="text-polish-meta hover:text-red-700 p-1 rounded transition-colors cursor-pointer"
                                title="Delete this novel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-polish-meta italic">No active manuscripts drafted.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Inline form to create book beautifully */
              <form onSubmit={handleAddNewNovel} className="space-y-4 text-xs animate-fade-in" id="add-novel-form">
                <p className="text-[10px] text-polish-meta font-sans font-bold uppercase tracking-wider font-semibold">Draft New Manuscript Set</p>
                
                <div>
                  <label className="block text-polish-meta font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECHOES OF THE CITADEL"
                    value={newNovelTitle}
                    onChange={(e) => setNewNovelTitle(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-xs focus:outline-none focus:border-polish-dark"
                  />
                </div>

                <div>
                  <label className="block text-polish-meta font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle / Volume</label>
                  <input
                    type="text"
                    placeholder="e.g. Volume II : Relic Memoirs"
                    value={newNovelSubtitle}
                    onChange={(e) => setNewNovelSubtitle(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-xs focus:outline-none focus:border-polish-dark"
                  />
                </div>

                <div>
                  <label className="block text-polish-meta font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Author Name</label>
                  <input
                    type="text"
                    placeholder="e.g. James Ashcroft"
                    value={newNovelAuthor}
                    onChange={(e) => setNewNovelAuthor(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-sans text-xs focus:outline-none focus:border-polish-dark"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#1A1A1A] text-[#F9F7F2] font-sans font-bold uppercase tracking-wider py-2 rounded text-[10px] hover:bg-black transition-all cursor-pointer"
                  >
                    Draft Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 bg-transparent border border-polish-border text-polish-text font-sans font-bold uppercase tracking-wider py-2 rounded text-[10px] hover:bg-[#F0EEE8] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Manuscript Layout settings card */}
          {activeNovel && config && (
            <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-6 shadow-sm" id="sidebar-layout-controls">
            <div className="flex items-center space-x-2 border-b border-polish-border pb-3">
              <Sliders className="w-4 h-4 text-polish-text" />
              <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">Manuscript Matrix</h2>
            </div>

            {/* Form fields styled beautifully */}
            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Book Title</label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-sm focus:outline-none focus:border-polish-dark focus:ring-1 focus:ring-polish-dark transition-all"
                  id="cfg-input-title"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Subtitle / Vol</label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-sm focus:outline-none focus:border-polish-dark focus:ring-1 focus:ring-polish-dark transition-all"
                  id="cfg-input-subtitle"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Author Full Name</label>
                <input
                  type="text"
                  value={config.authorName}
                  onChange={(e) => setConfig(prev => ({ ...prev, authorName: e.target.value }))}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 text-polish-dark font-sans text-xs focus:outline-none focus:border-polish-dark focus:ring-1 focus:ring-polish-dark transition-all"
                  id="cfg-input-author"
                />
              </div>

              {/* Typography Selector */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Font Family</label>
                <div className="grid grid-cols-3 gap-1 bg-[#F0EEE8] p-1 rounded border border-polish-border" id="cfg-font-selector">
                  {(['times', 'courier', 'helvetica'] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => setConfig(prev => ({ ...prev, fontFamily: font }))}
                      className={`py-1.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition ${
                        config.fontFamily === font
                          ? 'bg-polish-dark font-bold text-polish-paper'
                          : 'text-polish-text hover:text-polish-dark'
                      }`}
                      id={`btn-cfg-font-${font}`}
                    >
                      {font === 'times' ? 'Times' : font === 'courier' ? 'Courier' : 'Sans'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Spacing */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Line Spacing</label>
                <div className="grid grid-cols-3 gap-1 bg-[#F0EEE8] p-1 rounded border border-polish-border" id="cfg-spacing-selector">
                  {([1.15, 1.5, 2.0] as const).map((spacing) => (
                    <button
                      key={spacing}
                      onClick={() => setConfig(prev => ({ ...prev, lineSpacing: spacing }))}
                      className={`py-1.5 rounded text-[10px] font-sans font-bold transition ${
                        config.lineSpacing === spacing
                          ? 'bg-polish-dark font-bold text-polish-paper'
                          : 'text-polish-text hover:text-polish-dark'
                      }`}
                      id={`btn-cfg-spacing-${spacing}`}
                    >
                      {spacing}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins size */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Page Sheet Margin</label>
                <div className="grid grid-cols-3 gap-1 bg-[#F0EEE8] p-1 rounded border border-polish-border" id="cfg-margin-selector">
                  {(['narrow', 'standard', 'wide'] as const).map((margin) => (
                    <button
                      key={margin}
                      onClick={() => setConfig(prev => ({ ...prev, marginSize: margin }))}
                      className={`py-1.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition ${
                        config.marginSize === margin
                          ? 'bg-polish-dark font-bold text-polish-paper'
                          : 'text-polish-text hover:text-polish-dark'
                      }`}
                      id={`btn-cfg-margin-${margin}`}
                    >
                      {margin === 'narrow' ? '0.75"' : margin === 'standard' ? '1.0"' : '1.25"'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Size */}
              <div>
                <label className="block text-polish-meta font-sans font-bold text-[10px] uppercase tracking-wider mb-1">Paper Dimensions</label>
                <div className="grid grid-cols-2 gap-1 bg-[#F0EEE8] p-1 rounded border border-polish-border" id="cfg-papersize-selector">
                  {(['letter', 'a4'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setConfig(prev => ({ ...prev, pageSize: sz }))}
                      className={`py-1.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider transition ${
                        config.pageSize === sz
                          ? 'bg-polish-dark text-polish-paper'
                          : 'text-polish-text hover:text-polish-dark'
                      }`}
                      id={`btn-cfg-size-${sz}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Informational Tip Card */}
            <div className="bg-[#FAF9F5] border border-polish-border p-4 rounded flex space-x-2 text-[11px] text-polish-text leading-relaxed" id="cfg-info-tip">
              <Info className="w-4 h-4 text-polish-meta shrink-0 mt-0.5" />
              <p>
                Traditional standards rely on left justification, double-spaced lines, running header matrices, and precise margins to assure publisher compliance.
              </p>
            </div>
          </div>
          )}

          {/* Workspace Safeguard & Backup Hub */}
          <div className="bg-polish-paper border border-polish-border rounded-xl p-5 space-y-4 shadow-sm animate-fade-in" id="sidebar-safety-backup">
            <div className="flex items-center space-x-2 border-b border-polish-border pb-3">
              <Sliders className="w-4 h-4 text-polish-text rotate-90" />
              <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">Safeguard & Backups</h2>
            </div>
            
            <p className="text-[11px] text-polish-text leading-relaxed">
              Draftsmith is <strong>100% offline-first & open-source</strong>. None of your novels are uploaded to any server or cloud database.
            </p>

            <div className="space-y-2.5 bg-amber-50/50 border border-amber-200/60 rounded p-3 text-[11px]">
              <div className="flex gap-2 items-start text-amber-900">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block">Browser Cache & Crashes:</strong>
                  Your text is protected against unexpected browser or computer crashes via real-time local buffer memory. However, <span className="underline">manually clearing your browser cache or cookies will wipe all local work</span>.
                </div>
              </div>
            </div>

            <div className="space-y-3.5 pt-1.5">
              <div>
                <p className="text-[10px] text-polish-meta font-sans font-bold uppercase tracking-wider mb-2">1. Export Library Backup</p>
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FAF9F5] border border-polish-border hover:bg-[#F0EEE8] transition text-xs font-sans font-bold uppercase tracking-wider text-polish-dark rounded cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup File
                </button>
              </div>

              <div>
                <p className="text-[10px] text-polish-meta font-sans font-bold uppercase tracking-wider mb-1.5">2. Restore Workspace</p>
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FAF9F5] border border-polish-border border-dashed hover:bg-[#F0EEE8] hover:border-polish-dark transition text-xs font-sans font-bold uppercase tracking-wider text-polish-dark rounded cursor-pointer text-center">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Backup (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {backupStatus && (
              <div className={`p-3 rounded text-[11px] leading-relaxed transition-all duration-300 ${
                backupStatus.type === 'success' 
                  ? 'bg-green-50 text-green-900 border border-green-200' 
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}>
                {backupStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Tab Workspace Viewports */}
        <div className="lg:col-span-9 space-y-6" id="workspace-arena">
          
          {/* Navigation Tab Anchors */}
          {activeNovel && (
            <div className="flex bg-polish-paper p-1.5 rounded-xl border border-polish-border shadow-sm flex-wrap items-center justify-between gap-3" id="main-navigation-tabs">
              <div className="flex flex-1 gap-1 min-w-[280px]">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-polish-dark text-[#F9F7F2] shadow-sm'
                      : 'text-polish-text hover:text-polish-dark'
                  }`}
                  id="tab-btn-preview"
                >
                  <BookOpen className="w-4 h-4" />
                  1. Format Previewer
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'editor'
                      ? 'bg-polish-dark text-[#F9F7F2] shadow-sm'
                      : 'text-polish-text hover:text-polish-dark'
                  }`}
                  id="tab-btn-editor"
                >
                  <PenTool className="w-4 h-4" />
                  2. Chapter Editor
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'export'
                      ? 'bg-polish-dark text-[#F9F7F2] shadow-sm'
                      : 'text-polish-text hover:text-polish-dark'
                  }`}
                  id="tab-btn-export"
                >
                  <Download className="w-4 h-4" />
                  3. Compile & Export
                </button>
              </div>

              {/* Instant + button on central canvas toolbar */}
              <button
                onClick={() => {
                  setShowAddForm(true);
                  document.getElementById('sidebar-container')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="py-2 px-3 border border-polish-border rounded-lg bg-[#FAF9F5] text-polish-dark hover:bg-polish-dark hover:text-polish-paper font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer self-stretch"
                id="canvas-add-novel-header-btn"
                title="Create a new novel"
              >
                <Plus className="w-4 h-4" />
                <span>New Novel</span>
              </button>
            </div>
          )}

          {/* Active viewport views */}
          <div className="h-full" id="active-tab-content-area">
            {!activeNovel ? (
              /* High-Craft Blank space canvas by default with a + button and design */
              <div className="bg-polish-paper border border-polish-border rounded-xl p-8 sm:p-20 text-center space-y-10 shadow-sm flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden" id="empty-canvas-state">
                <div className="absolute inset-8 border border-dashed border-polish-meta/20 pointer-events-none rounded-lg"></div>
                <div className="max-w-md mx-auto space-y-6 z-10 animate-fade-in">
                  <div className="w-20 h-20 bg-[#FAF9F5] border border-polish-border rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Plus className="w-10 h-10 text-[#1A1A1A]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-serif italic font-bold text-[#1A1A1A]">No Active Manuscript</h2>
                    <p className="text-xs text-polish-text leading-relaxed">
                      Initialize a clean typesetting project. Fill out the details below to open a blank parchment canvas formatted to publisher-grade standards.
                    </p>
                  </div>
                  
                  {/* Inline Creation Form on Canvas */}
                  <form onSubmit={handleAddNewNovel} className="space-y-4 text-xs text-left bg-[#FAF9F5] p-6 border border-polish-border rounded-lg shadow-sm">
                    <div>
                      <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Novel Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. THE EMERALD CHRONICLES"
                        value={newNovelTitle}
                        onChange={(e) => setNewNovelTitle(e.target.value)}
                        className="w-full bg-white border border-polish-border rounded px-3 py-2.5 text-[#1A1A1A] font-serif text-sm focus:outline-none focus:border-polish-dark"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Subtitle / Vol</label>
                        <input
                          type="text"
                          placeholder="e.g. Volume One"
                          value={newNovelSubtitle}
                          onChange={(e) => setNewNovelSubtitle(e.target.value)}
                          className="w-full bg-white border border-polish-border rounded px-3 py-2 text-polish-dark font-serif text-xs focus:outline-none focus:border-polish-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-[#1A1A1A] font-sans font-bold text-[9px] uppercase tracking-wider mb-1">Author Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Jane Austen"
                          value={newNovelAuthor}
                          onChange={(e) => setNewNovelAuthor(e.target.value)}
                          className="w-full bg-white border border-polish-border rounded px-3 py-2 text-polish-dark font-sans text-xs focus:outline-none focus:border-polish-dark"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#1A1A1A] hover:bg-black text-[#F9F7F2] font-sans font-bold uppercase tracking-wider py-3.5 rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Start Typesetting Manuscript
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'preview' && (
                  <div className="animate-fade-in" id="viewport-preview">
                    <BookViewer 
                      pages={pages} 
                      config={config} 
                      setConfig={setConfig} 
                    />
                  </div>
                )}

                {activeTab === 'editor' && (
                  <div className="animate-fade-in" id="viewport-editor">
                    <EditorView 
                      chapters={chapters} 
                      setChapters={setChapters} 
                      originalStory={handleRestoreOriginal} 
                    />
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-6 animate-fade-in" id="viewport-export">
                    {/* PDF Compilation trigger component */}
                    <PdfExporter 
                      chapters={chapters} 
                      config={config} 
                    />

                    {/* Standard submission info card */}
                    <div className="p-6 bg-[#FAF9F5] border border-polish-border rounded-xl space-y-4">
                      <div className="flex items-center space-x-2 text-[#1A1A1A]">
                        <BookMarked className="w-4 h-4 text-[#706E6B]" />
                        <h4 className="text-xs font-sans font-bold uppercase tracking-widest text-[#1A1A1A]">Manuscript Standard Guidelines</h4>
                      </div>
                      <p className="text-xs leading-relaxed text-[#5F5D5A] text-justify">
                        Standard literary submissions require precise double-spacing, running headers with author last name, and clear chapter divisions. This studio automates pages, pagination indexes, and formatting rules instantly.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-polish-paper border-t border-polish-border py-6 px-10 text-center text-xs text-[#706E6B] font-sans flex justify-center items-center" id="applet-footer">
        <span>© {new Date().getFullYear()} omparhad — Crafting Elegant Literary Typography (Open Source)</span>
      </footer>

    </div>
  );
}
