import React, { useState, useRef, useEffect } from 'react';
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

  // Measure stage container width for precise scale calculations
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(560);

  useEffect(() => {
    if (!stageContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(stageContainerRef.current);
    return () => observer.disconnect();
  }, [spreadMode]); // Recalculate on spread mode shifts as well

  // Filter out any pages if none exist
  if (pages.length === 0) return null;

  // Exact Millimeter-to-Pixel Coordinates Mapper matching jsPDF Math
  const isA4 = config.pageSize === 'a4';
  const pageWidthMm = isA4 ? 210 : 215.9;
  const pageHeightMm = isA4 ? 297 : 279.4;

  let marginMm = 25.4; // Default: 1 inch (25.4 mm)
  if (config.marginSize === 'narrow') marginMm = 19.05; // 0.75 inch
  if (config.marginSize === 'wide') marginMm = 31.75; // 1.25 inch

  const pxPerMm = 560 / pageWidthMm;
  const pageHeightPx = pageHeightMm * pxPerMm;
  const paddingPx = marginMm * pxPerMm;

  const ptToMm = 0.352778;
  const fontSizePx = config.fontSize * ptToMm * pxPerMm;

  const spacingMultiplier = config.lineSpacing === 2.0 ? 1.85 : (config.lineSpacing === 1.5 ? 1.45 : 1.15); 
  const lineHeightPx = config.fontSize * ptToMm * spacingMultiplier * pxPerMm;
  const paragraphSpacingPx = 4 * pxPerMm;
  const chapterHeadingTopMarginPx = 15 * pxPerMm; // calibrated top visual onset offset

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
        <ul 
          className="list-disc pl-6 text-left font-mono tracking-tight text-polish-text" 
          style={{ 
            fontSize: `${fontSizePx * 0.9}px`, 
            lineHeight: `${lineHeightPx}px`,
            marginBottom: `${paragraphSpacingPx}px` 
          }}
          id={`list-${Math.random()}`}
        >
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
        <div 
          className="border-l-4 border-polish-dark pl-4 bg-[#F0EEE8]/40 italic"
          style={{ 
            fontSize: `${fontSizePx}px`, 
            lineHeight: `${lineHeightPx}px`,
            marginBottom: `${paragraphSpacingPx}px`
          }}
        >
          {p.split('\n').map((line, idx) => (
            <div key={idx} className="text-left" style={{ lineHeight: `${lineHeightPx}px` }}>{line}</div>
          ))}
        </div>
      );
    }

    // Letters or highly formatted blocks
    if (p.includes('Dear Mr. Edward') || p.includes('Dear James Ashcroft') || p.includes('In earnest faith') || p.startsWith('To James Ashcroft') || p.startsWith('To James')) {
      return (
        <div 
          className="pl-4 italic text-polish-text border-l-2 border-polish-border" 
          style={{ 
            textIndent: '0',
            fontSize: `${fontSizePx}px`, 
            lineHeight: `${lineHeightPx}px`,
            marginBottom: `${paragraphSpacingPx}px`
          }}
        >
          {p.split('\n').map((line, idx) => (
            <div key={idx} className="text-left" style={{ lineHeight: `${lineHeightPx}px` }}>{line}</div>
          ))}
        </div>
      );
    }

    // Checking inline formatting inside standard paragraph (bold labels, etc)
    const isRationalSupTable = p.startsWith('• Rational:') || p.startsWith('• Supernatural:');
    if (isRationalSupTable) {
      return (
        <p 
          className="text-left font-mono leading-relaxed" 
          style={{ 
            textIndent: '1em',
            fontSize: `${fontSizePx * 0.95}px`, 
            lineHeight: `${lineHeightPx}px`,
            marginBottom: `${paragraphSpacingPx}px`
          }}
        >
          {p}
        </p>
      );
    }

    return (
      <p 
        className="text-justify font-normal" 
        style={{ 
          textIndent: p.trim().startsWith('CHAPTER') || p.trim().startsWith('*') ? '0' : '2rem',
          fontSize: `${fontSizePx}px`,
          lineHeight: `${lineHeightPx}px`,
          marginBottom: `${paragraphSpacingPx}px`
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
        className={`relative w-[560px] shrink-0 border border-polish-border rounded ${paperThemeClassMap[config.paperColor]} transition-colors duration-300 flex flex-col justify-between overflow-hidden select-none`}
        style={{
          height: `${pageHeightPx}px`,
        }}
        id={`page-sheet-${pageIdx}`}
      >
        {/* Margin Guides */}
        {showMargins && (
          <div 
            className="absolute border border-dashed border-polish-meta/40 pointer-events-none z-10" 
            style={{
              top: `${paddingPx}px`,
              bottom: `${paddingPx}px`,
              left: `${paddingPx}px`,
              right: `${paddingPx}px`,
            }}
            id={`guides-${pageIdx}`}
          >
            <span className="absolute -top-5 left-1 text-[8px] text-polish-meta font-mono">
              {(marginMm / 25.4).toFixed(2)}" Top
            </span>
            <span className="absolute -bottom-5 left-1 text-[8px] text-polish-meta font-mono">
              {(marginMm / 25.4).toFixed(2)}" Bottom
            </span>
            <span className="absolute top-1/2 -left-6 transform -rotate-90 text-[8px] text-polish-meta font-mono">
              {(marginMm / 25.4).toFixed(2)}" Left
            </span>
            <span className="absolute top-1/2 -right-7 transform rotate-90 text-[8px] text-polish-meta font-mono">
              {(marginMm / 25.4).toFixed(2)}" Right
            </span>
          </div>
        )}

        {/* Normal Page */}
        {!page.isTitlePage ? (
          <>
            {/* Running Header */}
            <div 
              className="absolute border-b border-polish-border/40 pb-2"
              style={{
                top: `${15 * pxPerMm}px`,
                left: `${paddingPx}px`,
                right: `${paddingPx}px`,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase text-right">
                {page.header}
              </span>
            </div>

            {/* Page Content Area (Perfect match to pagination coordinates) */}
            <div 
              className={`absolute overflow-hidden ${fontClassMap[config.fontFamily]}`}
              style={{
                top: `${30 * pxPerMm}px`,
                bottom: `${marginMm * pxPerMm}px`,
                left: `${paddingPx}px`,
                right: `${paddingPx}px`,
                fontSize: `${fontSizePx}px`,
                lineHeight: `${lineHeightPx}px`
              }}
            >
              {/* Chapter Start Header */}
              {page.isChapterStart && page.chapterTitle && (
                <div 
                  className="text-center select-none flex flex-col justify-center"
                  style={{
                    height: `${35 * pxPerMm}px`,
                  }}
                >
                  <h2 
                    className="font-bold tracking-widest uppercase"
                    style={{ fontSize: `${fontSizePx}px`, marginBottom: `${4 * pxPerMm}px` }}
                  >
                    {page.chapterNumber}
                  </h2>
                  <h3 
                    className="font-normal italic tracking-wide"
                    style={{ fontSize: `${fontSizePx}px` }}
                  >
                    {page.chapterTitle}
                  </h3>
                </div>
              )}

              {/* Page paragraphs */}
              <div className="space-y-0">
                {page.paragraphs.map((p, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {renderParagraph(p)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
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
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-hidden min-h-[450px]" ref={stageContainerRef}>
        <div className="w-full flex items-center justify-center">
          {/* Flip buttons */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-3 mr-4 rounded-full bg-polish-paper border border-polish-border hover:bg-[#F0EEE8] shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0 z-10"
            id="viewer-btn-prev"
          >
            <ChevronLeft className="w-5 h-5 text-polish-dark" />
          </button>

          {/* Book Stage Canvas Container with scale mapping */}
          {(() => {
            const targetWidth = spreadMode ? 1144 : 560;
            const targetHeight = pageHeightPx;
            // Subtract space for the sidebar / layout margins and flip buttons smoothly
            const availableWidth = Math.max(280, containerWidth - 110);
            const scale = Math.min(1, availableWidth / targetWidth);

            return (
              <div 
                className="overflow-hidden flex items-center justify-center transition-all duration-150"
                style={{ 
                  width: `${targetWidth * scale}px`, 
                  height: `${targetHeight * scale}px` 
                }}
                id="book-canvas-scale-viewport"
              >
                <div 
                  className="flex gap-6 justify-center items-start origin-top"
                  style={{
                    width: `${targetWidth}px`,
                    height: `${targetHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    flexShrink: 0,
                  }}
                  id="book-stage"
                >
                  <AnimatePresence mode="wait">
                    {spreadMode ? (
                      <>
                        {/* Left Spread */}
                        {activeIndex < totalPages ? renderPage(activeIndex) : null}
                        {/* Right Spread */}
                        {activeIndex + 1 < totalPages ? renderPage(activeIndex + 1) : (
                          <div 
                            className="hidden lg:flex w-[560px] rounded border border-dashed border-polish-border flex-col items-center justify-center text-polish-meta text-xs font-serif bg-[#F0EEE8] shrink-0"
                            style={{ height: `${pageHeightPx}px` }}
                          >
                            Back of Cover Sheet
                          </div>
                        )}
                      </>
                    ) : (
                      renderPage(activeIndex)
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}

          <button
            onClick={handleNext}
            disabled={spreadMode ? activeIndex + 2 >= totalPages : activeIndex === totalPages - 1}
            className="p-3 ml-4 rounded-full bg-polish-paper border border-polish-border hover:bg-[#F0EEE8] shadow-sm disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0 z-10"
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
