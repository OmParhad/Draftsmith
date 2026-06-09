import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Scaling, FileText, Sparkles } from 'lucide-react';
import { ManuscriptConfig, PageLayout } from '../types';

interface BookViewerProps {
  pages: PageLayout[];
  config: ManuscriptConfig;
  setConfig: React.Dispatch<React.SetStateAction<ManuscriptConfig>>;
}

export const BookViewer: React.FC<BookViewerProps> = ({ pages, config, setConfig }) => {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [showMargins, setShowMargins] = useState<boolean>(false);
  const [spreadMode, setSpreadMode] = useState<boolean>(false);

  // Filter out any pages if none exist
  if (pages.length === 0) return null;

  const fontClassMap = {
    times: 'font-serif',
    courier: 'font-mono',
    helvetica: 'font-sans',
  };

  const spacingClassMap = {
    1.15: 'leading-normal',
    1.5: 'leading-relaxed',
    2.0: 'leading-loose',
  };

  const paperThemeClassMap = {
    white: 'bg-white text-polish-dark border-polish-border shadow-sm',
    cream: 'bg-[#F9F7F2] text-polish-dark border-polish-border shadow-sm',
    sepia: 'bg-[#F0EEE8] text-[#4A4844] border-polish-border shadow-sm',
    dark: 'bg-[#1A1A1A] text-[#F9F7F2] border-zinc-800 shadow-md',
  };

  const totalPages = pages.length;

  const handleNext = () => {
    if (spreadMode) {
      setCurrentPage((prev) => Math.min(prev + 2, totalPages - 1 - (totalPages % 2 === 0 ? 0 : 0)));
    } else {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
    }
  };

  const handlePrev = () => {
    if (spreadMode) {
      setCurrentPage((prev) => Math.max(0, prev - 2));
    } else {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  };

  const getMarginClass = () => {
    if (config.marginSize === 'narrow') return 'p-8 sm:p-12';
    if (config.marginSize === 'wide') return 'p-16 sm:p-24';
    return 'p-12 sm:p-16'; // standard (1 inch)
  };

  // Helper to parse line highlights, signatures and lists nicely
  const renderParagraph = (p: string) => {
    if (p.startsWith('•') || p.startsWith('-')) {
      const items = p.trim().split('\n');
      return (
        <ul className="list-disc pl-8 my-4 space-y-2 text-left text-sm font-mono tracking-tight text-polish-text" id={`list-${Math.random()}`}>
          {items.map((item, idx) => (
            <li key={idx} id={`li-${idx}`}>
              {item.replace(/^[•-]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    
    // Check if paragraph is actually a document summary block (e.g. Affiliated Merchants)
    if (p.includes('Affiliated Merchants & Houses') || p.includes('Affiliated Merchants')) {
      return (
        <div className="border-l-4 border-[#1A1A1A] pl-4 py-2 my-4 bg-[#F0EEE8] italic text-[14px]">
          {p.split('\n').map((line, idx) => (
            <p key={idx} className="my-1 text-left">{line}</p>
          ))}
        </div>
      );
    }

    // Letters or highly formatted blocks
    if (p.includes('Dear Mr. Edward') || p.includes('Dear James Ashcroft') || p.includes('In earnest faith') || p.startsWith('To James Ashcroft') || p.startsWith('To James')) {
      return (
        <div className="pl-6 italic my-5 text-polish-text border-l-2 border-polish-border" style={{ textIndent: '0' }}>
          {p.split('\n').map((line, idx) => (
            <p key={idx} className="my-1 text-left">{line}</p>
          ))}
        </div>
      );
    }

    // Checking inline formatting inside standard paragraph (bold labels, etc)
    const isRationalSupTable = p.startsWith('• Rational:') || p.startsWith('• Supernatural:');
    if (isRationalSupTable) {
      return (
        <p className="my-3 text-left font-mono text-sm leading-relaxed" style={{ textIndent: '1em' }}>
          {p}
        </p>
      );
    }

    return (
      <p 
        className="text-justify font-normal" 
        style={{ 
          textIndent: p.trim().startsWith('CHAPTER') || p.trim().startsWith('*') ? '0' : '2.5rem',
          marginBottom: '1rem'
        }}
      >
        {p}
      </p>
    );
  };

  // Render a Single Page
  const renderPage = (pageIdx: number) => {
    const page = pages[pageIdx];
    if (!page) return null;

    return (
      <motion.div
        key={pageIdx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25 }}
        className={`relative aspect-[1/1.294] w-full max-w-[560px] border border-polish-border rounded ${paperThemeClassMap[config.paperColor]} transition-colors duration-300 flex flex-col justify-between`}
        id={`page-sheet-${pageIdx}`}
      >
        {/* Margin Guides */}
        {showMargins && (
          <div className="absolute inset-8 sm:inset-12 border border-dashed border-polish-meta/40 pointer-events-none z-10" id={`guides-${pageIdx}`}>
            <span className="absolute -top-5 left-1 text-[8px] text-polish-meta font-mono">1" Top</span>
            <span className="absolute -bottom-5 left-1 text-[8px] text-polish-meta font-mono">1" Bottom</span>
            <span className="absolute top-1/2 -left-6 transform -rotate-90 text-[8px] text-polish-meta font-mono">1" Left</span>
            <span className="absolute top-1/2 -right-7 transform rotate-90 text-[8px] text-polish-meta font-mono">1" Right</span>
          </div>
        )}

        {/* Normal Page */}
        {!page.isTitlePage ? (
          <div className={`flex-1 flex flex-col justify-between ${getMarginClass()}`}>
            {/* Running Header */}
            <div className="flex justify-end border-b border-polish-border pb-2 mb-4">
              <span className="text-[11px] font-mono tracking-wider opacity-80 uppercase text-right">
                {page.header}
              </span>
            </div>

            {/* Page Content Area */}
            <div className={`flex-1 flex flex-col justify-start text-[14px] leading-relaxed ${fontClassMap[config.fontFamily]} ${spacingClassMap[config.lineSpacing]}`}>
              {/* Chapter Start Header */}
              {page.isChapterStart && page.chapterTitle && (
                <div className="text-center my-8 select-none">
                  <h2 className="text-[14px] font-bold tracking-widest uppercase mb-1">
                    {page.chapterNumber}
                  </h2>
                  <h3 className="text-[14px] font-normal italic tracking-wide">
                    {page.chapterTitle}
                  </h3>
                  <div className="h-4"></div>
                </div>
              )}

              {/* Page paragraphs */}
              <div className="space-y-1">
                {page.paragraphs.map((p, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {renderParagraph(p)}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Empty footer indicator */}
            <div className="h-4"></div>
          </div>
        ) : (
          /* Title Page Layout */
          <div className="flex-1 flex flex-col justify-center items-center p-16">
            <div className="text-center select-none space-y-4">
              <h1 className="text-[18px] md:text-[20px] font-bold tracking-[0.15em] uppercase text-polish-dark max-w-[400px] leading-relaxed">
                {config.title}
              </h1>
              {config.subtitle && (
                <p className="text-[14px] italic opacity-80 font-serif leading-relaxed max-w-[320px] text-polish-text">
                  {config.subtitle}
                </p>
              )}
              
              <div className="py-8 text-xs font-mono tracking-widest text-polish-meta">
                — MANUSCRIPT FORMAT —
              </div>
              
              <div className="pt-8">
                <p className="text-sm font-semibold tracking-wide uppercase opacity-90 text-polish-dark">
                  By {config.authorName}
                </p>
                <p className="text-xs font-mono opacity-60 mt-1 text-polish-meta">
                  Draft Class Standard
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const activeIndex = currentPage;

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] border border-polish-border rounded-xl spill-hidden overflow-hidden shadow-sm" id="book-viewer-container">
      {/* Workspace Menu Bar */}
      <div className="bg-[#FAF9F5] border-b border-polish-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between z-10" id="viewer-menu">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-polish-dark" />
          <div>
            <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-polish-dark">Live Manuscript Preview</h3>
            <p className="text-xs text-polish-text">Authentic double-pass page compiler</p>
          </div>
        </div>

        {/* Formatting Fast Controls & Toggle Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Paper selector */}
          <div className="flex bg-[#F0EEE8] p-1 rounded border border-polish-border text-xs animate-fade-in" id="paper-bg-palette">
            {(['white', 'cream', 'sepia', 'dark'] as const).map((col) => (
              <button
                key={col}
                onClick={() => setConfig(prev => ({ ...prev, paperColor: col }))}
                className={`px-3 py-1 rounded text-[10px] font-sans font-bold capitalize transition-all ${
                  config.paperColor === col
                    ? 'bg-polish-dark text-polish-paper font-bold shadow-sm'
                    : 'text-polish-text hover:text-polish-dark'
                }`}
                title={`Switch to ${col} paper`}
                id={`paper-${col}`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Toggle Margin guides */}
          <button
            onClick={() => setShowMargins(!showMargins)}
            className={`px-3 py-1.5 rounded transition-all border text-xs font-sans font-bold flex items-center gap-1.5 ${
              showMargins
                ? 'bg-polish-dark text-polish-paper border-polish-dark'
                : 'border-polish-border bg-[#F9F7F2] text-polish-text hover:text-polish-dark'
            }`}
            title="Toggle margin rulers"
            id="btn-margin-guides"
          >
            <Scaling className="w-3.5 h-3.5" />
            <span>Rulers</span>
          </button>

          {/* Spread mode */}
          <button
            onClick={() => {
              setSpreadMode(!spreadMode);
              setCurrentPage(0); // reset
            }}
            className={`px-3 py-1.5 rounded transition-all border text-xs font-sans font-bold flex items-center gap-1.5 ${
              spreadMode
                ? 'bg-polish-dark text-polish-paper border-polish-dark'
                : 'border-polish-border bg-[#F9F7F2] text-polish-text hover:text-polish-dark'
            }`}
            title="Toggle Double Page / Book spread View"
            id="btn-spread-view"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{spreadMode ? 'Double Page' : 'Book spread'}</span>
          </button>
          
          {/* Quick Stats */}
          <div className="text-[10px] font-mono font-bold text-polish-text bg-[#F0EEE8] px-3 py-1.5 rounded border border-polish-border">
            {pages.length} Pages
          </div>
        </div>
      </div>

      {/* Pages Container Stage */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto min-h-[450px]">
        <div className="w-full flex items-center justify-center">
          {/* Flip buttons */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-3 mr-4 rounded-full bg-polish-paper border border-polish-border hover:bg-[#F0EEE8] shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
            id="viewer-btn-prev"
          >
            <ChevronLeft className="w-5 h-5 text-polish-dark" />
          </button>

          {/* Book Stage Canvas */}
          <div className={`flex gap-6 max-w-full justify-center ${spreadMode ? 'w-full lg:max-w-[1100px]' : 'max-w-[560px] w-full'}`} id="book-stage">
            <AnimatePresence mode="wait">
              {spreadMode ? (
                <>
                  {/* Left Spread */}
                  {activeIndex < totalPages ? renderPage(activeIndex) : null}
                  {/* Right Spread */}
                  {activeIndex + 1 < totalPages ? renderPage(activeIndex + 1) : (
                    <div className="hidden lg:flex aspect-[1/1.294] w-full max-w-[560px] rounded border border-dashed border-polish-border flex-col items-center justify-center text-polish-meta text-xs font-serif bg-[#F0EEE8]">
                      Back of Cover Sheet
                    </div>
                  )}
                </>
              ) : (
                renderPage(activeIndex)
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleNext}
            disabled={spreadMode ? activeIndex + 2 >= totalPages : activeIndex === totalPages - 1}
            className="p-3 ml-4 rounded-full bg-polish-paper border border-polish-border hover:bg-[#F0EEE8] shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
            id="viewer-btn-next"
          >
            <ChevronRight className="w-5 h-5 text-polish-dark" />
          </button>
        </div>
      </div>

      {/* Footer controls */}
      <div className="bg-[#FAF9F5] px-6 py-4 flex items-center justify-between border-t border-polish-border text-xs text-polish-meta font-sans" id="viewer-footer">
        <div>
          {spreadMode ? (
            <span>Showing pages {activeIndex + 1} - {Math.min(activeIndex + 2, totalPages)} of {totalPages}</span>
          ) : (
            <span>Showing page {activeIndex + 1} of {totalPages}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Alignment Ratio: (1 : 1.29) Letter Size Sheet</span>
        </div>
      </div>
    </div>
  );
};
