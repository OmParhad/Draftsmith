import { useState, useMemo, useEffect, FormEvent, MouseEvent } from 'react';
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
  Trash2
} from 'lucide-react';

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
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return []; // Empty library by default
  });

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

  // Keep state in sync with loaded active novel
  useEffect(() => {
    if (activeNovel) {
      setChapters(activeNovel.chapters);
      setConfig(activeNovel.config);
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
      setActiveNovelId('');
      localStorage.removeItem('manuscript_active_novel_id');
    }
  }, [activeNovel, activeNovelId]);

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
      localStorage.setItem('manuscript_active_novel_id', id);
      localStorage.setItem('manuscript_novels', JSON.stringify(updatedNovels));
    }
  };

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

  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'export'>('preview');

  // 2. Memoized Pagination
  const pages = useMemo(() => {
    if (!activeNovel || !config) return [];
    return paginateManuscript(chapters, config);
  }, [chapters, config, activeNovel]);

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

  return (
    <div className="min-h-screen bg-polish-bg text-polish-dark flex flex-col justify-between font-sans antialiased" id="applet-viewport">
      
      {/* Premium Studio Header in Professional Polish Style */}
      <header className="bg-polish-paper border-b border-polish-border px-6 md:px-10 py-5 sticky top-0 z-50 flex flex-col sm:flex-row sm:items-end justify-between gap-4" id="applet-header">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-polish-meta font-sans font-bold">A Free Studio for Novelists</p>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-polish-dark text-polish-paper rounded">
              <BookMarked className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-cormorant font-semibold tracking-wide text-polish-dark">
              Draftsmith
            </h1>
          </div>
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
      <footer className="bg-polish-paper border-t border-polish-border py-6 px-10 text-center text-xs text-[#706E6B] font-sans flex flex-col md:flex-row justify-between items-center gap-4" id="applet-footer">
        <div className="flex gap-6">
          <p><span className="font-bold">STUDIO:</span> PROFESSIONAL TYPESETTER</p>
        </div>
        <span>© {new Date().getFullYear()} Manuscript Studio — Crafting Elegant Literary Typography</span>
      </footer>

    </div>
  );
}
