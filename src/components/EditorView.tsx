import React, { useState } from 'react';
import { Chapter } from '../types';
import { FileText, Save, RefreshCw, PenTool, Check, Layers } from 'lucide-react';

interface EditorViewProps {
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  originalStory: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({ chapters, setChapters, originalStory }) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(chapters[0]?.id || '');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

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

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] border border-polish-border rounded-xl overflow-hidden shadow-sm animate-fade-in" id="editor-view-container">
      {/* Editor Header */}
      <div className="bg-[#FAF9F5] border-b border-polish-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between" id="editor-header">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-polish-dark" />
          <div>
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-polish-dark">Manuscript Editor</h3>
            <p className="text-xs text-polish-text">Write, revise, and align typeset sequences</p>
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
            <Save className="w-3.5 h-3.5" />
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
            className="p-2 border border-polish-border text-polish-text hover:text-polish-dark bg-[#FAF9F5] hover:bg-[#F0EEE8] rounded transition-all"
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
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-polish-border bg-[#F0EEE8] overflow-y-auto p-4 space-y-2 select-none" id="editor-chapters-sidebar">
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
                className={`w-full text-left p-3 rounded border transition-all ${
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
          
          <div className="pt-6 border-t border-polish-border mt-6 px-2 text-center text-[10px] font-sans font-bold text-polish-meta uppercase tracking-wider">
            Length: <strong className="font-bold text-polish-dark">{totalWords}</strong> words
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
                <span className="text-[10pt] font-mono text-polish-meta">
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
    </div>
  );
};
