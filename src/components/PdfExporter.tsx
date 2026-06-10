import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Chapter, ManuscriptConfig, PageLayout } from '../types';
import { Download, Check, Sparkles, FileText, Settings, BookOpen } from 'lucide-react';
import { paginateManuscript } from '../utils/paginator';

interface PdfExporterProps {
  chapters: Chapter[];
  config: ManuscriptConfig;
}

export const PdfExporter: React.FC<PdfExporterProps> = ({ chapters, config }) => {
  const [exportProgress, setExportProgress] = useState<number>(-1);
  const [downloadReady, setDownloadReady] = useState<boolean>(false);
  const [pdfSizeKb, setPdfSizeKb] = useState<number>(0);

  const fontNameMap: Record<string, string> = {
    times: 'Times-Roman',
    courier: 'Courier',
    helvetica: 'Helvetica'
  };

  const handleExport = async () => {
    setExportProgress(0);
    setDownloadReady(false);

    try {
      // Small simulated compilation steps to show premium UI progress
      await new Promise(resolve => setTimeout(resolve, 350));
      setExportProgress(20);

      const isA4 = config.pageSize === 'a4';
      const width = isA4 ? 210 : 215.9; // mm
      const height = isA4 ? 297 : 279.4; // mm

      let margin = 25.4; // Default: 1 inch (25.4 mm)
      if (config.marginSize === 'narrow') margin = 19.05; // 0.75 inch
      if (config.marginSize === 'wide') margin = 31.75; // 1.25 inch

      const textWidth = width - (margin * 2);

      // Create primary PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: config.pageSize === 'letter' ? 'letter' : 'a4'
      });

      const fontName = fontNameMap[config.fontFamily] || 'Times-Roman';
      doc.setFont(fontName);

      // 1. Render Cover Title Page (Page 1)
      setExportProgress(40);
      doc.setFontSize(20);
      doc.setFont(fontName, 'bold');
      
      // Center Title vertically and horizontally
      const uppercaseTitle = config.title.toUpperCase();
      doc.text(uppercaseTitle, width / 2, height / 2 - 20, { align: 'center' });
      
      if (config.subtitle) {
        doc.setFont(fontName, 'italic');
        doc.setFontSize(14);
        doc.text(config.subtitle, width / 2, height / 2, { align: 'center' });
      }

      doc.setFont(fontName, 'normal');
      doc.setFontSize(11);
      doc.text("— MANUSCRIPT ORIGINAL —", width / 2, height / 2 + 25, { align: 'center' });
      
      doc.setFont(fontName, 'bold');
      doc.setFontSize(13);
      doc.text(`BY ${config.authorName.toUpperCase()}`, width / 2, height / 2 + 50, { align: 'center' });

      // Build pages mapping
      const paginatedPages = paginateManuscript(chapters, config);
      
      // Exclude Title Page from processing since we rendered it as cover
      const contentPages = paginatedPages.filter(p => !p.isTitlePage);

      const ptToMm = 0.352778;
      const singleLineHeightMm = config.fontSize * ptToMm;
      // standard spacing adjustments
      const spacingMultiplier = config.lineSpacing === 2.0 ? 1.85 : (config.lineSpacing === 1.5 ? 1.45 : 1.15); 
      const lineHeightMm = singleLineHeightMm * spacingMultiplier;

      await new Promise(resolve => setTimeout(resolve, 350));
      setExportProgress(60);

      // Render subsequent content pages
      contentPages.forEach((page, index) => {
        doc.addPage();
        
        // Reset base font on page start
        doc.setFont(fontName, 'normal');
        doc.setFontSize(config.fontSize);

        // A. Draw Running Header (Page number refers to original page + 1 due to Cover page)
        const absolutePageNum = page.pageNumber;
        const upAuthor = config.authorLastName.toUpperCase();
        const upTitle = config.shortTitle.toUpperCase();
        const headerStr = `${upAuthor} / ${upTitle} / ${absolutePageNum}`;
        
        doc.setFontSize(10);
        doc.setFont(fontName, 'normal');
        // Place header 15mm from top, flush-right to margin
        doc.text(headerStr, width - margin, 15, { align: 'right' });

        // B. Handle Chapter Start headings
        let currentY = 30; // standard top offset
        doc.setFontSize(config.fontSize);

        if (page.isChapterStart && page.chapterTitle) {
          doc.setFont(fontName, 'bold');
          // Draw "CHAPTER ONE"
          doc.text(page.chapterNumber || '', width / 2, 45, { align: 'center' });
          doc.setFont(fontName, 'italic');
          // Draw Subheading
          doc.text(page.chapterTitle, width / 2, 51, { align: 'center' });
          currentY = 65; // major leap for chapter onset
        }

        // C. Render Paragraphs
        page.paragraphs.forEach((p) => {
          doc.setFont(fontName, 'normal');
          doc.setFontSize(config.fontSize);

          // Custom styling for letters & lists
          let hasLetterMargin = p.includes('Dear Mr. Edward') || p.includes('Dear James Ashcroft') || p.startsWith('To James Ashcroft') || p.includes('In earnest faith');
          let isList = p.startsWith('•') || p.startsWith('-');
          
          let lines: string[] = [];
          if (isList) {
            lines = p.split('\n');
          } else {
            lines = doc.splitTextToSize(p, textWidth);
          }

          lines.forEach((line, lineIdx) => {
            // Indent paragraph first-line (Except letters/lists)
            let xOffset = margin;
            if (lineIdx === 0 && !hasLetterMargin && !isList && !p.startsWith('•') && !p.startsWith('CHAPTER') && !p.startsWith('*')) {
              xOffset += 12; // 12mm indentation (~0.5 inches)
            } else if (hasLetterMargin) {
              xOffset += 8; // indent letter blocks gracefully
            } else if (isList) {
              xOffset += 5; // offset list entries
            }

            // Bold headers inside pages for special blocks
            if (line.includes('Affiliated Merchants & Houses') || line.startsWith('CHAPTER') || line === 'Hamilton') {
              doc.setFont(fontName, 'bold');
            } else if (hasLetterMargin || line.startsWith('“To James Ashcroft') || line.startsWith('My dear colleague') || line.endsWith('— Edward Hound.”')) {
              doc.setFont(fontName, 'italic');
            } else {
              doc.setFont(fontName, 'normal');
            }

            doc.text(line, xOffset, currentY);
            currentY += lineHeightMm;
          });

          // space between paragraphs
          currentY += 4;
        });
      });

      setExportProgress(80);
      await new Promise(resolve => setTimeout(resolve, 350));

      // Get byte size and save
      const pdfBlob = doc.output('blob');
      setPdfSizeKb(Math.round(pdfBlob.size / 1024));

      // Download file triggers
      const fileName = `${config.shortTitle.toLowerCase().replace(/\s+/g, '_')}_manuscript.pdf`;
      doc.save(fileName);

      setExportProgress(100);
      setDownloadReady(true);
    } catch (e) {
      console.error(e);
      setExportProgress(-1);
    }
  };

  return (
    <div className="bg-[#FAF9F5] border border-polish-border rounded-xl p-6 shadow-sm space-y-6 animate-fade-in" id="pdf-exporter-panel">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-[#F0EEE8] text-polish-dark rounded">
          <Download className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-polish-dark">Publish & Download Bundle</h3>
          <p className="text-xs text-polish-text">Assemble print-ready vector manuscripts and folio sets</p>
        </div>
      </div>

      {/* Formatting Setup Controls */}
      <div className="bg-[#FAF9F5] rounded border border-polish-border p-5 space-y-4 text-xs font-sans text-polish-dark">
        <span className="text-[10px] text-polish-meta tracking-wider uppercase block font-bold">Export Layout Parameters</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-polish-meta mb-1 font-bold">Author Lastname (Header)</span>
            <input
              type="text"
              value={config.authorLastName}
              onChange={(e) => {
                // Ensure config updates propagate
                config.authorLastName = e.target.value.toUpperCase();
              }}
              className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 focus:outline-none focus:border-polish-dark uppercase text-polish-dark font-sans text-xs"
              placeholder="e.g. HOUND"
              id="pdf-config-lastname"
            />
          </div>
          <div>
            <span className="block text-polish-meta mb-1 font-bold">Short Book Title (Header)</span>
            <input
              type="text"
              value={config.shortTitle}
              onChange={(e) => {
                // Ensure config updates propagate
                config.shortTitle = e.target.value.toUpperCase();
              }}
              className="w-full bg-[#FAF9F5] border border-polish-border rounded px-3 py-2 focus:outline-none focus:border-polish-dark uppercase text-polish-dark font-sans text-xs"
              placeholder="e.g. THE SUMMER HUNTING"
              id="pdf-config-shorttitle"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-polish-border pt-4">
          <div>
            <span className="block text-polish-meta mb-1 font-bold">Line Spacing</span>
            <div className="text-xs text-polish-dark font-bold mt-1">
              {config.lineSpacing === 2.0 ? 'Double Double (2.0)' : config.lineSpacing === 1.5 ? 'Publisher Standard (1.5)' : 'Compact (1.15)'}
            </div>
          </div>
          <div>
            <span className="block text-polish-meta mb-1 font-bold">Font Family</span>
            <div className="text-xs text-polish-dark font-bold mt-1 capitalize">
              {config.fontFamily === 'times' ? 'Times New Roman' : config.fontFamily === 'courier' ? 'Courier Typewriter' : 'Helvetica Sans'}
            </div>
          </div>
          <div>
            <span className="block text-polish-meta mb-1 font-bold">Page Format</span>
            <div className="text-xs text-polish-dark font-bold mt-1 uppercase">
              {config.pageSize} | {config.marginSize}
            </div>
          </div>
        </div>
      </div>

      {/* Button Action */}
      <div className="flex flex-col space-y-4">
        {exportProgress === -1 || exportProgress === 100 ? (
          <button
            onClick={handleExport}
            className="w-full bg-[#1A1A1A] hover:bg-black text-[#F9F7F2] font-sans uppercase font-bold tracking-wider py-3.5 px-4 rounded border border-polish-dark shadow-sm flex items-center justify-center gap-2 transition cursor-pointer text-xs"
            id="pdf-btn-download"
          >
            <Download className="w-4 h-4" />
            Compile & Export PDF File
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-sans text-polish-dark font-bold">
              <span>Compiling typesetting matrices...</span>
              <span>{exportProgress}%</span>
            </div>
            <div className="w-full bg-[#F0EEE8] rounded-full h-2 border border-polish-border">
              <div
                className="bg-polish-dark h-[6px] rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Download ready confirmation */}
        {downloadReady && (
          <div className="lg:p-5 bg-[#FAF9F5] border border-green-700/40 rounded flex items-start space-x-3 text-xs animate-fade-in" id="pdf-ready-state">
            <Check className="w-4 h-4 text-green-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-sans font-bold text-green-700 uppercase tracking-wide">
                PDF successfully generated and downloaded!
              </p>
              <p className="text-polish-text mt-1.5 leading-relaxed">
                Size: <strong className="font-bold text-polish-dark">{pdfSizeKb} KB</strong>. Page breaking and manuscript headers computed beautifully to meet industry standards. Open the file on your device to print or send to editors!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
