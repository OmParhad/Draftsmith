import React, { useState } from 'react';
import { Chapter } from '../types';
import { 
  FileText, Save, RefreshCw, PenTool, Check, Layers, Upload, Loader2, X, Plus, Trash2, 
  Maximize2, Minimize2, Sparkles, Fingerprint, Undo2, AlertCircle, ShieldCheck, HelpCircle,
  ChevronLeft, ChevronRight 
} from 'lucide-react';

interface EditorViewProps {
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  originalStory: () => void;
}

const numberWords = [
  "ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", 
  "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN", "TWENTY"
];

const getChapterNumberText = (index: number): string => {
  if (index < numberWords.length) {
    return `CHAPTER ${numberWords[index]}`;
  }
  return `CHAPTER ${index}`;
};

export const EditorView: React.FC<EditorViewProps> = ({ chapters, setChapters, originalStory }) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  // Grammar correction and originality check state hooks
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState<boolean>(false);
  const [grammarError, setGrammarError] = useState<string>('');
  const [grammarSuccessMessage, setGrammarSuccessMessage] = useState<string>('');
  const [previousContentState, setPreviousContentState] = useState<{ [chapterId: string]: string }>({});

  const [isPlagiarismChecking, setIsPlagiarismChecking] = useState<boolean>(false);
  const [plagiarismError, setPlagiarismError] = useState<string>('');
  const [plagiarismReport, setPlagiarismReport] = useState<{
    originalityScore: number;
    status: string;
    overallAnalysis: string;
    flaggedSections: { phrase: string; similarityReason: string; suggestedAlternative: string }[];
  } | null>(null);
  const [showPlagiarismPanel, setShowPlagiarismPanel] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Importer states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingState, setImportingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'new-chapter' | 'auto-split'>('new-chapter');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZenMode(false);
      }
    };
    if (isZenMode) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZenMode]);

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  // grammar correction execution handler
  const handleAutocorrectGrammar = async () => {
    if (!activeChapter) return;
    if (!activeChapter.content.trim()) {
      setGrammarError("Please insert literary content to autocorrect.");
      return;
    }

    setIsCorrectingGrammar(true);
    setGrammarError('');
    setGrammarSuccessMessage('');

    try {
      const response = await fetch("/api/editor/autocorrect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeChapter.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server could not proofread grammar.");
      }

      const data = await response.json();
      if (data.correctedText) {
        // Save current state for undo support
        setPreviousContentState((prev) => ({
          ...prev,
          [activeChapter.id]: activeChapter.content,
        }));

        setChapters((prev) =>
          prev.map((c) =>
            c.id === activeChapter.id ? { ...c, content: data.correctedText } : c
          )
        );
        setHasChanges(true);
        setSavedStatus(false);
        setGrammarSuccessMessage("Grammar corrections synchronized!");
        setTimeout(() => setGrammarSuccessMessage(''), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setGrammarError(err.message || "Failed to finalize grammar polishing.");
    } finally {
      setIsCorrectingGrammar(false);
    }
  };

  // Undo grammar autocorrect handler
  const handleUndoGrammar = () => {
    if (!activeChapter) return;
    const historyText = previousContentState[activeChapter.id];
    if (historyText !== undefined) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapter.id ? { ...c, content: historyText } : c
        )
      );
      // Remove undo history for this state
      setPreviousContentState((prev) => {
        const copy = { ...prev };
        delete copy[activeChapter.id];
        return copy;
      });
      setHasChanges(true);
      setSavedStatus(false);
      setGrammarSuccessMessage("Reverted to original text copy.");
      setTimeout(() => setGrammarSuccessMessage(''), 3000);
    }
  };

  // Plagiarism report handler
  const handlePlagiarismCheck = async () => {
    if (!activeChapter) return;
    if (!activeChapter.content.trim()) {
      setPlagiarismError("Please write copy to check originality.");
      return;
    }

    setIsPlagiarismChecking(true);
    setPlagiarismError('');
    setPlagiarismReport(null);
    setShowPlagiarismPanel(true); // Open analysis side panel instantly

    try {
      const response = await fetch("/api/editor/plagiarism-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeChapter.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server could not analyze plagiarism status.");
      }

      const data = await response.json();
      setPlagiarismReport(data);
    } catch (err: any) {
      console.error(err);
      setPlagiarismError(err.message || "Plagiarism scanning encountered an error.");
    } finally {
      setIsPlagiarismChecking(false);
    }
  };

  // Replace flagged sequence handler
  const handleReplacePhrase = (oldPhrase: string, newPhrase: string) => {
    if (!activeChapter) return;
    const currentText = activeChapter.content;
    const index = currentText.indexOf(oldPhrase);
    let updatedText = "";
    
    if (index !== -1) {
      updatedText = currentText.replace(oldPhrase, newPhrase);
    } else {
      // Direct replacement fallback (with safe escape characters)
      const escapedPhrase = oldPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedPhrase, 'gi');
      updatedText = currentText.replace(regex, newPhrase);
    }

    setChapters((prev) =>
      prev.map((c) =>
        c.id === activeChapter.id ? { ...c, content: updatedText } : c
      )
    );
    setHasChanges(true);
    setSavedStatus(false);

    // Filter out resolved row
    if (plagiarismReport) {
      const updatedFlagged = plagiarismReport.flaggedSections.filter(
        (sec) => sec.phrase !== oldPhrase
      );
      setPlagiarismReport({
        ...plagiarismReport,
        flaggedSections: updatedFlagged,
      });
    }
  };

  const handleTextChange = (text: string) => {
    if (!activeChapter) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapter.id ? { ...c, content: text } : c))
    );
    setHasChanges(true);
    setSavedStatus(false);
  };

  const handleTitleChange = (title: string) => {
    if (!activeChapter) return;
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapter.id ? { ...c, title: title } : c))
    );
    setHasChanges(true);
    setSavedStatus(false);
  };

  const handleSave = () => {
    setHasChanges(false);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleAddChapter = () => {
    const nextIdx = chapters.length + 1;
    const newNumber = getChapterNumberText(nextIdx);
    const newChap: Chapter = {
      id: `chap_${Date.now()}`,
      number: newNumber,
      title: `Untitled Chapter`,
      content: `Start writing your new chapter here...`
    };
    setChapters((prev) => [...prev, newChap]);
    setActiveChapterId(newChap.id);
    setHasChanges(true);
    setSavedStatus(false);
  };

  const handleDeleteChapter = (id: string, title: string) => {
    if (chapters.length <= 1) {
      alert("You must keep at least one chapter in your manuscript.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete chapter "${title || 'Untitled'}"?`)) {
      setChapters((prev) => {
        const index = prev.findIndex((c) => c.id === id);
        const filtered = prev.filter((c) => c.id !== id);
        
        // Recalculate chapter numbers for sequence mapping consistency
        const updated = filtered.map((c, i) => ({
          ...c,
          number: getChapterNumberText(i + 1)
        }));
        
        // Determine new active chapter
        if (activeChapterId === id) {
          const nextActiveIdx = Math.max(0, Math.min(index, updated.length - 1));
          if (updated[nextActiveIdx]) {
            setActiveChapterId(updated[nextActiveIdx].id);
          }
        }
        
        return updated;
      });
      setHasChanges(true);
      setSavedStatus(false);
    }
  };

  const calculateWordCount = (text: string) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/);
    return words[0] === '' ? 0 : words.length;
  };

  const totalWords = chapters.reduce((acc, chap) => acc + calculateWordCount(chap.content), 0);

  // File loading and PDF parsing helpers
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        // set up the worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = () => {
        reject(new Error('Failed to load the PDF parser. Please check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  };

  const parseFileContent = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        extractedText += pageText + '\n\n';
      }
      
      if (!extractedText.trim()) {
        throw new Error('This PDF appears to contain scan images or has no extractable text blocks. Please try flat TXT or MD drafts.');
      }
      return extractedText;
    } else {
      // Raw plain text or markdown extraction
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string || '');
        };
        reader.onerror = () => reject(new Error('Failed to read document stream.'));
        reader.readAsText(file);
      });
    }
  };

  const splitChapters = (text: string): { title: string; content: string }[] => {
    // Splits text dynamically upon seeing keyword alignments like CHAPTER IX or Chapter 4 etc.
    const splitRegex = /(?=(?:^|\n)\s*(?:CHAPTER|Chapter)\s+\w+)/g;
    const parts = text.split(splitRegex);
    const result: { title: string; content: string }[] = [];
    
    parts.forEach((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;
      
      const lines = trimmedPart.split('\n');
      const firstLine = lines[0].trim();
      
      let title = `Draft Session Part ${index + 1}`;
      let finalContent = trimmedPart;
      
      if (firstLine.toUpperCase().startsWith('CHAPTER')) {
        title = firstLine;
        finalContent = lines.slice(1).join('\n').trim();
      }
      
      result.push({
        title: title,
        content: finalContent
      });
    });
    
    if (result.length === 0 && text.trim()) {
      result.push({
        title: 'Imported Manuscript',
        content: text.trim()
      });
    }
    
    return result;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf' || ext === 'txt' || ext === 'md') {
        setImportFile(file);
        setImportingState('idle');
        setImportError('');
      } else {
        setImportError('Unsupported extension format. Kindly feed clean PDF, TXT, or MD sheets.');
        setImportingState('error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setImportFile(file);
      setImportingState('idle');
      setImportError('');
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    setImportingState('loading');
    setImportError('');

    try {
      const text = await parseFileContent(importFile);

      if (importMode === 'append') {
        if (!activeChapter) {
          throw new Error('Please select an active target chapter cell from your sidebar first.');
        }
        setChapters((prev) =>
          prev.map((c) =>
            c.id === activeChapter.id
              ? { ...c, content: c.content + '\n\n' + text.trim() }
              : c
          )
        );
        setHasChanges(true);
      } else if (importMode === 'new-chapter') {
        const nextIdx = chapters.length + 1;
        const newNumber = getChapterNumberText(nextIdx);
        const newChap: Chapter = {
          id: `chap_${Date.now()}`,
          number: newNumber,
          title: importFile.name.replace(/\.[^/.]+$/, "").slice(0, 30) || 'Imported Entry',
          content: text.trim()
        };
        setChapters((prev) => [...prev, newChap]);
        setActiveChapterId(newChap.id);
        setHasChanges(true);
      } else if (importMode === 'auto-split') {
        const parts = splitChapters(text);
        if (parts.length === 0) {
          throw new Error('We could not automatically segment the document content blocks.');
        }

        const newChaps: Chapter[] = parts.map((part, index) => {
          const nextIdx = chapters.length + index + 1;
          const newNumber = getChapterNumberText(nextIdx);
          return {
            id: `chap_${Date.now()}_${index}`,
            number: newNumber,
            title: part.title || `Imported Part ${index + 1}`,
            content: part.content
          };
        });

        setChapters((prev) => [...prev, ...newChaps]);
        setActiveChapterId(newChaps[0].id);
        setHasChanges(true);
      }

      setImportingState('success');
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportingState('idle');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setImportingState('error');
      setImportError(err.message || 'An unexpected failure during extraction sequences.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] border border-polish-border rounded-xl ... transition relative overflow-hidden shadow-sm animate-fade-in" id="editor-view-container">
      {/* Editor Header */}
      <div className="bg-[#FAF9F5] border-b border-polish-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between" id="editor-header">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            className={`p-1.5 border rounded-md transition-all cursor-pointer flex items-center justify-center shadow-xs ${
              isSidebarCollapsed
                ? 'bg-amber-50 border-amber-200 text-[#7D5A12] hover:bg-amber-100'
                : 'bg-white border-polish-border text-polish-dark hover:bg-neutral-100'
            }`}
            title={isSidebarCollapsed ? "Show Chapters Mapping Sidebar" : "Hide Chapters Mapping Sidebar"}
            id="editor-header-toggle-sidebar"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <Layers className="w-4 h-4 text-polish-dark hidden sm:block" />
          <div>
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-polish-dark mr-2">Manuscript Editor</h3>
            <p className="text-xs text-polish-text line-clamp-1">Write, revise, and align typeset sequences</p>
          </div>
        </div>

        {/* Header CTA Tools */}
        <div className="flex items-center gap-3">
          {/* Saved Status Indicator */}
          {savedStatus && (
            <span className="text-[11px] text-green-700 flex items-center gap-1 font-sans font-bold uppercase tracking-wider animate-fade-in" id="indicator-saved">
              <Check className="w-3.5 h-3.5" /> Synchronized
            </span>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-3 py-1.5 rounded text-[11px] font-sans font-bold uppercase tracking-wider border transition-all ${
              hasChanges
                ? 'bg-[#1A1A1A] hover:bg-black text-[#F9F7F2] border-[#1A1A1A] shadow-sm cursor-pointer'
                : 'bg-[#F0EEE8] text-polish-meta border-polish-border cursor-not-allowed'
            }`}
            id="editor-btn-save"
          >
            <Save className="w-3.5 h-3.5 mr-1 inline-block align-middle" />
            Save Draft
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              if (window.confirm("Restore original Edward Hound manuscript chapters? Your custom edits will be reset.")) {
                originalStory();
                setHasChanges(false);
              }
            }}
            className="p-2 border border-polish-border text-polish-text hover:text-polish-dark bg-[#FAF9F5] hover:bg-[#F0EEE8] rounded transition-all cursor-pointer"
            title="Restore default chapters layout"
            id="editor-btn-reset"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
          </button>
        </div>
      </div>

      {/* Editor Split Columns */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[700px]">
        {/* Navigation Sidebar (Chapters list) */}
        <div 
          className={`bg-[#F0EEE8] overflow-y-auto select-none flex flex-col justify-between transition-all duration-300 ${
            isSidebarCollapsed 
              ? 'w-0 h-0 p-0 overflow-hidden border-r-0 border-b-0 md:w-0' 
              : 'w-full md:w-64 p-4 border-b md:border-b-0 md:border-r border-polish-border'
          }`} 
          id="editor-chapters-sidebar"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-sans font-bold tracking-widest text-[#706E6B] uppercase">
                  Chapters Mapping
                </span>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-0.5 hover:bg-neutral-250 hover:text-polish-dark text-polish-meta rounded transition cursor-pointer flex items-center justify-center"
                  title="Collapse Chapters Sidebar"
                  id="btn-collapse-sidebar-inner"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={handleAddChapter}
                className="flex items-center justify-center gap-1 py-0.5 px-2 bg-[#FAF9F5] border border-polish-border rounded text-[9px] font-sans font-bold text-[#1A1A1A] hover:bg-[#FAF9F5]/40 hover:border-[#1A1A1A]/40 transition duration-150 cursor-pointer shadow-sm uppercase tracking-wider"
                title="Create blank chapter"
                id="btn-add-chapter-top"
              >
                <Plus className="w-2.5 h-2.5" /> Add
              </button>
            </div>

            <div className="space-y-1.5 max-h-[250px] md:max-h-none overflow-y-auto pr-1" id="editor-chapters-list">
              {chapters.map((chap) => {
                const wordCount = calculateWordCount(chap.content);
                const isActive = chap.id === activeChapterId;
                return (
                  <div key={chap.id} className="relative group flex items-stretch">
                    <button
                      onClick={() => setActiveChapterId(chap.id)}
                      className={`flex-1 text-left p-3 pr-10 rounded border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF9F5] border-polish-border text-polish-dark shadow-sm font-bold'
                          : 'bg-transparent border-transparent text-[#706E6B] hover:text-[#1A1A1A] hover:bg-black/5'
                      }`}
                      id={`btn-editor-select-${chap.id}`}
                    >
                      <div className="text-[10px] font-sans font-bold tracking-wider text-polish-meta uppercase">
                        {chap.number}
                      </div>
                      <div className="text-xs font-serif font-bold mt-0.5 truncate text-polish-dark">
                        {chap.title}
                      </div>
                      <div className="text-[10px] font-mono mt-1.5 flex items-center gap-1 text-polish-meta">
                        <FileText className="w-3 h-3" /> {wordCount} words
                      </div>
                    </button>
                    {chapters.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(chap.id, chap.title);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded bg-[#FAF9F5]/90 hover:bg-red-50 text-[#706E6B] hover:text-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer flex items-center justify-center shadow-sm border border-polish-border/40 hover:border-red-200 animate-fade-in"
                        title="Delete this chapter"
                        id={`btn-delete-chapter-${chap.id}`}
                      >
                        <Trash2 className="w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-4 border-t border-polish-border mt-6 space-y-3">
            <div className="px-2 text-center text-[10px] font-sans font-bold text-polish-meta uppercase tracking-wider">
              Length: <strong className="font-bold text-polish-dark">{totalWords}</strong> words
            </div>

            {/* Create blank chapter at bottom */}
            <button
              onClick={handleAddChapter}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF9F5] border border-polish-border rounded text-[11px] font-sans font-bold text-[#1A1A1A] hover:bg-emerald-50/50 hover:border-emerald-200 transition duration-150 cursor-pointer shadow-sm uppercase tracking-wider"
              id="sidebar-btn-add-chapter-bottom"
            >
              <Plus className="w-3.5 h-3.5 text-polish-dark" />
              Add Blank Chapter
            </button>

            {/* Document draft importer element */}
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setImportFile(null);
                setImportingState('idle');
                setImportError('');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF9F5] border border-polish-border rounded text-[11px] font-sans font-bold text-polish-dark hover:bg-[#FAF9F5]/40 transition duration-150 cursor-pointer shadow-sm uppercase tracking-wider mb-2"
              id="sidebar-btn-import-pdf"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Draft PDF / TXT
            </button>
          </div>
        </div>

        {/* Text Area Workspace */}
        {activeChapter ? (
          <>
            <div className="flex-1 flex flex-col bg-[#FAF9F5] p-6 space-y-4" id="editor-input-area">
              {/* Title Editing Input */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-sans font-bold tracking-wider uppercase text-polish-meta">
                  Chapter Display Title
                </label>
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-polish-border rounded px-4 py-2 text-sm font-serif font-semibold focus:outline-none focus:border-polish-dark text-polish-dark"
                  placeholder="Chapter Title"
                  id="edit-input-title"
                />
              </div>

              {/* Grammar Helper Alert notifications */}
              {grammarError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 flex items-center gap-2 text-xs animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{grammarError}</span>
                </div>
              )}

              {grammarSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs animate-fade-in shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{grammarSuccessMessage}</span>
                </div>
              )}

              {/* Content Editing Input */}
              <div className="flex-1 flex flex-col space-y-1 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-sans font-bold tracking-wider uppercase text-polish-meta flex items-center gap-1.5">
                    Interactive Text Content
                    <span className="bg-amber-100 text-[#7D5A12] px-1.5 py-0.5 rounded text-[8px] font-mono normal-case tracking-normal">
                      Click below to Write
                    </span>
                  </label>
                </div>

                {/* Draftsmith Typographic Canvas Bar */}
                <div className="flex flex-wrap items-center justify-between bg-[#F0EEE8] border border-polish-border border-b-0 rounded-t p-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-widest font-sans font-bold text-[#706E6B] text-[9px] px-1.5 py-0.5 bg-white border border-polish-border rounded select-none">
                      Draftsmith Typographic Studio
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-mono text-polish-meta font-medium">
                        {calculateWordCount(activeChapter.content).toLocaleString()} words
                      </span>
                      <span className="text-[8px] font-mono text-polish-meta/70 font-semibold">
                        {activeChapter.content.length.toLocaleString()} chars
                      </span>
                    </div>
                    <button
                      onClick={() => setIsZenMode(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#1A1A1A]/70 rounded text-[10px] font-sans font-bold uppercase tracking-wider text-polish-dark hover:bg-[#1A1A1A] hover:text-white transition cursor-pointer shadow-xs"
                      title="Immersive Fullscreen Focus Writing Layout"
                      id="btn-trigger-focus-mode"
                    >
                      <Maximize2 className="w-3" />
                      <span>Focus screen</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 flex flex-col">
                  <textarea
                    value={activeChapter.content}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onFocus={() => setIsZenMode(true)}
                    className="flex-1 w-full bg-[#FAF9F5] border border-polish-border rounded-b p-5 text-sm font-serif leading-relaxed focus:outline-none focus:ring-1 focus:ring-polish-dark focus:border-polish-dark text-polish-dark overflow-y-auto resize-none min-h-[520px] transition-all cursor-zoom-in"
                    placeholder="Click here to start writing in immersive fullscreen layout..."
                    id="edit-input-textarea"
                  />
                  <div 
                    onClick={() => setIsZenMode(true)}
                    className="absolute bottom-3 right-3 bg-[#1A1A1A]/90 hover:bg-[#1A1A1A] text-white text-[9px] font-sans font-bold px-3 py-1.5 rounded uppercase tracking-wider select-none shadow-sm flex items-center gap-1.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Maximize2 className="w-3 h-3" /> Focus Writing Screen (Esc to close)
                  </div>
                </div>
              </div>
            </div>

            {/* Plagiarism Checker Right Sidebar panel */}
            {showPlagiarismPanel && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-polish-border bg-[#F5F3EC] overflow-y-auto p-5 flex flex-col gap-4 animate-fade-in shrink-0" id="editor-originality-panel">
                <div className="flex items-center justify-between border-b border-polish-border pb-2.5 select-none">
                  <div className="flex items-center gap-1.5 text-polish-dark">
                    <Fingerprint className="w-4 h-4 text-emerald-700 animate-pulse" />
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wide">Originality Audit</span>
                  </div>
                  <button 
                    onClick={() => setShowPlagiarismPanel(false)}
                    className="p-1 text-polish-meta hover:text-polish-dark rounded hover:bg-neutral-200 cursor-pointer transition-colors"
                    title="Close audit report"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isPlagiarismChecking && (
                  <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-sans font-extrabold text-polish-dark uppercase tracking-wider">Analyzing draft authenticity</p>
                      <p className="text-[9px] text-[#706E6B] animate-pulse">Running cross-literature scans...</p>
                    </div>
                  </div>
                )}

                {plagiarismError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-900 space-y-1.5 animate-fade-in">
                    <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Scan Interrupted</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">{plagiarismError}</p>
                  </div>
                )}

                {plagiarismReport && (
                  <div className="space-y-4 text-xs animate-fade-in">
                    {/* Unique original meter dashboard */}
                    <div className="bg-[#FAF9F5] border border-polish-border p-4 rounded-lg flex flex-col items-center text-center shadow-xs select-none">
                      <div className="text-[9px] font-sans font-extrabold uppercase tracking-widest text-polish-meta">Originality Score</div>
                      <div className="text-3xl font-serif font-black mt-1 text-polish-dark flex items-baseline gap-0.5">
                        {plagiarismReport.originalityScore}<span className="text-xs font-bold font-sans text-polish-meta">%</span>
                      </div>
                      
                      {/* Bar Level */}
                      <div className="w-full bg-[#E5E2D9] h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            plagiarismReport.originalityScore >= 80 
                              ? 'bg-emerald-600' 
                              : plagiarismReport.originalityScore >= 55 
                              ? 'bg-amber-500' 
                              : 'bg-rose-600'
                          }`}
                          style={{ width: `${plagiarismReport.originalityScore}%` }}
                        />
                      </div>

                      {/* Status Badge */}
                      <div className={`mt-3 px-2.5 py-0.5 rounded text-[9px] font-sans font-extrabold uppercase tracking-wide border ${
                        plagiarismReport.originalityScore >= 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : plagiarismReport.originalityScore >= 55
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {plagiarismReport.status}
                      </div>
                    </div>

                    {/* Overall Summary paragraph */}
                    <div className="bg-[#FAF9F5]/40 border border-polish-border/60 p-3 rounded-lg space-y-1.5">
                      <span className="text-[9px] font-sans font-extrabold text-polish-dark uppercase tracking-widest block border-b border-polish-border/40 pb-1">Executive Summary</span>
                      <p className="text-[10px] text-polish-text leading-relaxed text-justify whitespace-pre-line">{plagiarismReport.overallAnalysis}</p>
                    </div>

                    {/* Flagged rows details */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-sans font-extrabold text-[#706E6B] uppercase tracking-widest block">Duplicate or Cliché Sequences</span>
                      
                      {plagiarismReport.flaggedSections.length === 0 ? (
                        <div className="bg-emerald-50/20 border border-emerald-200/40 p-4 rounded-lg text-center space-y-2 text-emerald-800">
                          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
                          <div>
                            <p className="text-[10px] font-sans font-bold uppercase tracking-wider">Uniqueness Check Clear</p>
                            <p className="text-[9px] text-[#706E6B] mt-1">Excellent job! No generic prose, clichés, or structural citation concerns found.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {plagiarismReport.flaggedSections.map((sec, i) => (
                            <div key={i} className="bg-white border border-polish-border rounded-lg p-3 space-y-2.5 shadow-xs transition hover:border-[#1A1A1A]/30">
                              <div className="space-y-1">
                                <span className="text-[8px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 uppercase tracking-wide">Prose Warning</span>
                                <p className="text-[10px] font-serif italic text-polish-dark leading-relaxed">"{sec.phrase}"</p>
                              </div>

                              <div className="space-y-1 bg-[#FAF9F5] p-2 rounded border border-polish-border/30">
                                <span className="text-[8px] font-sans font-extrabold text-[#706E6B] uppercase tracking-wider">Stylistic Cliché Concern</span>
                                <p className="text-[9px] text-polish-text leading-tight">{sec.similarityReason}</p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[8px] font-sans font-extrabold text-emerald-800 uppercase tracking-widest">Polished Alternative Formulation</span>
                                <p className="text-[10px] font-serif font-bold text-emerald-950 leading-relaxed">"{sec.suggestedAlternative}"</p>
                              </div>

                              <button
                                onClick={() => handleReplacePhrase(sec.phrase, sec.suggestedAlternative)}
                                className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white border border-emerald-700 rounded text-[9px] font-sans font-bold uppercase tracking-wider cursor-pointer shadow-xs transition"
                                id={`btn-apply-replace-${i}`}
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>Apply Alternative</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-polish-meta text-xs">
            <PenTool className="w-12 h-12 text-polish-border mb-2 animate-bounce" />
            Please select a chapter from the sidebar to inspect or modify
          </div>
        )}
      </div>

      {/* Import PDF / Text Draft Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4" id="import-document-modal">
          <div className="bg-[#FAF9F5] border border-polish-border rounded-xl w-full max-w-lg p-6 shadow-2xl relative space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-polish-border pb-3">
              <div className="flex items-center space-x-2.5">
                <Upload className="w-5 h-5 text-[#1A1A1A]" />
                <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-[#1A1A1A]">Import Manuscript Draft</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-polish-meta hover:text-[#1A1A1A] p-1 rounded transition-colors cursor-pointer"
                id="btn-close-import-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              <p className="text-[11px] text-polish-text leading-relaxed">
                Add an existing PDF, text document, or Markdown file to expand your manuscript library. Our client-side engines parse raw textual blocks and auto-integrate them instantly.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-6 text-center transition-all ${
                  isDragging
                    ? 'border-[#1A1A1A] bg-[#F0EEE8]'
                    : importFile
                    ? 'border-green-300 bg-green-50/20 shadow-inner'
                    : 'border-polish-border bg-[#FAF9F5]/40 hover:bg-[#F0EEE8]/40'
                }`}
                id="modal-upload-dropping-zone"
              >
                <input
                  type="file"
                  id="manuscript-file-upload"
                  accept=".pdf,.txt,.md"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="manuscript-file-upload"
                  className="cursor-pointer space-y-2 block"
                >
                  <div className="w-12 h-12 bg-[#FAF9F5] border border-polish-border rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Upload className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  {importFile ? (
                    <div className="space-y-1">
                      <p className="font-serif text-[12px] font-bold text-green-800 truncate px-4">{importFile.name}</p>
                      <p className="text-[10px] font-mono text-polish-meta uppercase">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-sans font-bold tracking-wider uppercase text-[10px] text-[#1A1A1A]">Select PDF, TXT, or MD</p>
                      <p className="text-[10px] text-polish-meta">or drag and drop document file here</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Import options */}
              {importFile && (
                <div className="space-y-3 bg-[#F0EEE8]/40 border border-polish-border p-4 rounded-lg">
                  <span className="block text-[10px] font-sans font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">Execution Action Matrix</span>
                  
                  <div className="space-y-2">
                    {/* Option 1: New Chapter */}
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="new-chapter"
                        checked={importMode === 'new-chapter'}
                        onChange={() => setImportMode('new-chapter')}
                        className="text-[#1A1A1A] focus:ring-0 accent-[#1A1A1A]"
                      />
                      <span>
                        <strong className="font-bold text-[#1A1A1A]">Create New Chapter</strong>
                        <span className="block text-[10px] text-polish-meta">Append text as a clean standalone chapter sheet</span>
                      </span>
                    </label>

                    {/* Option 2: Append to existing */}
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="text-[#1A1A1A] focus:ring-0 accent-[#1A1A1A]"
                        disabled={!activeChapter}
                      />
                      <span className={!activeChapter ? "opacity-50" : ""}>
                        <strong className="font-bold text-[#1A1A1A]">Append to Active Selected Chapter</strong>
                        <span className="block text-[10px] text-polish-meta">Insert lines directly to the bottom of the current parchment</span>
                      </span>
                    </label>

                    {/* Option 3: Auto Split */}
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="auto-split"
                        checked={importMode === 'auto-split'}
                        onChange={() => setImportMode('auto-split')}
                        className="text-[#1A1A1A] focus:ring-0 accent-[#1A1A1A]"
                      />
                      <span>
                        <strong className="font-bold text-[#1A1A1A]">Divide Automatically (Multi-Chapter)</strong>
                        <span className="block text-[10px] text-polish-meta">Auto-split pages into multiple chapters upon matching "Chapter" keywords</span>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Status and Error states */}
              {importingState === 'loading' && (
                <div className="py-2 text-center text-polish-meta flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1A1A1A]" />
                  <span>Preparing & Parsing Document Content...</span>
                </div>
              )}

              {importingState === 'success' && (
                <div className="py-2 text-center text-green-700 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wide text-[10px]">
                  <Check className="w-4 h-4" />
                  <span>Manuscript successfully synchronized!</span>
                </div>
              )}

              {importingState === 'error' && (
                <div className="p-3 bg-red-100/50 text-red-900 border border-red-200 rounded text-[11px] leading-relaxed">
                  <strong className="font-bold block mb-1">Parsing Interrupted</strong>
                  {importError}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-polish-border pt-4">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-transparent border border-polish-border text-polish-text font-sans font-bold uppercase tracking-wider rounded text-[11px] hover:bg-[#F0EEE8] transition duration-150 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importFile || importingState === 'loading' || importingState === 'success'}
                className={`px-4 py-2 font-sans font-bold uppercase tracking-wider rounded text-[11px] flex items-center gap-1.5 transition duration-150 ${
                  importFile && importingState !== 'loading' && importingState !== 'success'
                    ? 'bg-[#1A1A1A] text-[#F9F7F2] hover:bg-black cursor-pointer shadow-sm'
                    : 'bg-[#F0EEE8] text-polish-meta border border-polish-border cursor-not-allowed'
                }`}
                id="btn-confirm-import"
              >
                {importingState === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Typesetting...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Deconstruct & Insert
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Immersive Focus Writing Desk (Full Screen Overlay) */}
      {isZenMode && activeChapter && (
        <div className="fixed inset-0 z-[200] bg-[#1A1A1A]/80 backdrop-blur-lg flex items-center justify-center p-4 md:p-8 animate-fade-in" id="zen-writing-desk">
          <div className="bg-[#FAF9F5] border border-[#1A1A1A]/10 rounded-xl w-full max-w-5xl h-[92vh] flex flex-col p-6 md:p-10 shadow-2xl relative animate-scale-up">
            
            {/* Header Area of the Writing Desk */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-polish-border/60 gap-4">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-sans font-extrabold text-polish-meta uppercase tracking-widest block">
                  {activeChapter.number} — FOCUS WRITING DESK
                </span>
                <input
                  type="text"
                  value={activeChapter.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-polish-border/40 focus:border-[#1A1A1A] focus:outline-none text-base md:text-lg font-serif font-bold text-[#1A1A1A] w-full py-0.5 transition-all text-ellipsis"
                  placeholder="Chapter Display Title"
                  id="zen-chapter-title-input"
                />
              </div>

              {/* Status and Action Panel */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="bg-[#F0EEE8] border border-polish-border px-3 py-1.5 rounded-lg font-mono text-[10px] text-polish-text flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold">{calculateWordCount(activeChapter.content)}</span> Words
                  </div>
                  <div className="text-[8px] text-polish-meta/70 font-semibold">
                    {activeChapter.content.length.toLocaleString()} chars
                  </div>
                </div>

                {savedStatus ? (
                  <span className="text-[10px] text-green-700 font-sans font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Synchronized
                  </span>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`px-3 py-1.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider border transition-all ${
                      hasChanges
                        ? 'bg-[#1A1A1A] hover:bg-black text-[#F9F7F2] border-[#1A1A1A] cursor-pointer shadow-sm'
                        : 'bg-[#F0EEE8] text-polish-meta border-polish-border cursor-not-allowed'
                    }`}
                    id="zen-btn-save"
                  >
                    <Save className="w-3 h-3 mr-1 inline-block" /> Save
                  </button>
                )}

                <button
                  onClick={() => setIsZenMode(false)}
                  className="px-3 py-1.5 bg-polish-paper border border-polish-border rounded text-[10px] font-sans font-bold text-polish-dark hover:bg-neutral-100 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                  title="Minimize writing workspace [Esc]"
                  id="zen-btn-close"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Close [Esc]
                </button>
              </div>
            </div>

            {/* Premium Parchment Sheet Layout */}
            <div className="flex-1 mt-6 flex flex-col items-center overflow-hidden bg-white/50 rounded-xl border border-polish-border/40 p-4 relative group/paper shadow-inner">
              
              <div className="w-full max-w-3xl flex-1 flex flex-col relative py-2 px-1">
                {/* Tiny watermark helper */}
                <div className="absolute top-1 right-1 text-[8px] font-sans font-bold text-polish-meta/40 tracking-wider select-none pointer-events-none group-focus-within/paper:opacity-10 transition-opacity uppercase">
                  Immersive Typesetting Mode
                </div>
                
                <textarea
                  value={activeChapter.content}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="flex-1 w-full bg-transparent text-base md:text-lg font-serif leading-loose text-polish-dark focus:outline-none overflow-y-auto resize-none p-2 focus:ring-0 focus:border-0"
                  placeholder="Let your narrative flow here..."
                  autoFocus
                  id="zen-input-textarea"
                />
              </div>

              {/* Status bar */}
              <div className="w-full max-w-3xl flex items-center justify-between text-[9px] font-sans font-medium text-polish-meta/70 pt-2 border-t border-polish-border/20">
                <span>PRESS <kbd className="bg-[#FAF9F5] border border-polish-border rounded px-1.5 py-0.5 font-bold shadow-xs">ESC</kbd> TO RETURN TO WORKSPACE LIVE LAYOUT</span>
                <span className="uppercase tracking-widest font-bold">Draftsmith Typographic Canvas</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
