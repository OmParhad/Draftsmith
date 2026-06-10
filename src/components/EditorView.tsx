import React, { useState } from 'react';
import { Chapter } from '../types';
import { FileText, Save, RefreshCw, PenTool, Check, Layers, Upload, Loader2, X } from 'lucide-react';

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

  // Importer states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importingState, setImportingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'new-chapter' | 'auto-split'>('new-chapter');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const activeChapter = chapters.find((c) => c.id === activeChapterId);

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
          <Layers className="w-5 h-5 text-polish-dark" />
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
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[400px]">
        {/* Navigation Sidebar (Chapters list) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-polish-border bg-[#F0EEE8] overflow-y-auto p-4 space-y-2 select-none flex flex-col justify-between" id="editor-chapters-sidebar">
          <div className="space-y-2">
            <div className="text-[10px] font-sans font-bold tracking-widest text-polish-meta uppercase mb-3 px-2">
              Chapters Mapping
            </div>
            {chapters.map((chap) => {
              const wordCount = calculateWordCount(chap.content);
              const isActive = chap.id === activeChapterId;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterId(chap.id)}
                  className={`w-full text-left p-3 rounded border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FAF9F5] border-polish-border text-polish-dark shadow-sm font-bold'
                      : 'bg-transparent border-transparent text-polish-text hover:text-[#1A1A1A] hover:bg-[#F0EEE8]'
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
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-polish-border mt-6 space-y-3">
            <div className="px-2 text-center text-[10px] font-sans font-bold text-polish-meta uppercase tracking-wider">
              Length: <strong className="font-bold text-polish-dark">{totalWords}</strong> words
            </div>

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

            {/* Content Editing Input */}
            <div className="flex-1 flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-sans font-bold tracking-wider uppercase text-polish-meta">
                  Interactive Text Content (Markdowns & Paragraphs)
                </label>
                <span className="text-[10pt] font-mono text-polish-meta text-right">
                  {calculateWordCount(activeChapter.content)} words
                </span>
              </div>
              <textarea
                value={activeChapter.content}
                onChange={(e) => handleTextChange(e.target.value)}
                className="flex-1 w-full bg-[#FAF9F5] border border-polish-border rounded p-5 text-sm font-serif leading-relaxed focus:outline-none focus:ring-1 focus:ring-polish-dark focus:border-polish-dark text-polish-dark overflow-y-auto resize-none min-h-[250px]"
                id="edit-input-textarea"
              />
            </div>
          </div>
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
    </div>
  );
};
