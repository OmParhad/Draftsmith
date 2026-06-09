import { jsPDF } from 'jspdf';
import { Chapter, ManuscriptConfig, PageLayout } from '../types';

export function paginateManuscript(
  chapters: Chapter[],
  config: ManuscriptConfig
): PageLayout[] {
  const pages: PageLayout[] = [];
  
  // Page size calculations (in mm)
  // Letter: 215.9 x 279.4 mm (8.5 x 11 in)
  // A4: 210 x 297 mm
  const isA4 = config.pageSize === 'a4';
  const width = isA4 ? 210 : 215.9;
  const height = isA4 ? 297 : 279.4;
  
  // Margins (in mm)
  let margin = 25.4; // Default: 1 inch (25.4 mm)
  if (config.marginSize === 'narrow') margin = 19.05; // 0.75 inch
  if (config.marginSize === 'wide') margin = 31.75; // 1.25 inch
  
  const textWidth = width - (margin * 2);
  const textHeight = height - (margin * 2) - 15; // Bottom buffer + header space
  
  // Headless PDF layout helper
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: config.pageSize === 'letter' ? 'letter' : 'a4'
  });
  
  // Title Page (No header, simple centered text)
  pages.push({
    pageNumber: 1,
    header: '',
    paragraphs: [],
    isTitlePage: true
  });
  
  let currentPageNum = 2;
  
  // Process each chapter
  chapters.forEach((chapter) => {
    const chapterPages: PageLayout[] = [];
    
    // Set up doc font for text split size calculation
    const fontMapping: Record<string, string> = {
      times: 'Times-Roman',
      courier: 'Courier',
      helvetica: 'Helvetica'
    };
    const fontName = fontMapping[config.fontFamily] || 'Times-Roman';
    doc.setFont(fontName);
    doc.setFontSize(config.fontSize);
    
    // Split chapter content into paragraph strings
    const paragraphs = chapter.content.split(/\n\s*\n/);
    
    // Initialize first page for this chapter
    let currentParagraphsInPage: string[] = [];
    let currentY = 30; // Start position (excluding header spacer)
    
    // Header for the page
    const getHeaderString = (pNum: number) => {
      const upAuthor = config.authorLastName.toUpperCase();
      const upTitle = config.shortTitle.toUpperCase();
      return `${upAuthor} / ${upTitle} / ${pNum}`;
    };
    
    // Chapter Title Heading spacing requirements
    // Centered Chapter Number (e.g. "CHAPTER ONE")
    // Centered Chapter Title (e.g. "The Last Breath of KPX-3039")
    // Double space before the first paragraph
    const isChapterStart = true;
    let initialPage = true;
    
    // Paragraph loop
    for (let i = 0; i < paragraphs.length; i++) {
      let para = paragraphs[i].trim();
      if (!para) continue;
      
      // Handle the inner lists or special text if any
      // E.g., handling Affiliated Merchants & Houses Bullet lists cleanly
      let isList = para.includes('\n•') || para.includes('\n-');
      
      // Calculate split lines
      let lines: string[] = [];
      if (isList) {
        // Keeps bullet list paragraphs broken into individual lines nicely
        lines = para.split('\n');
      } else {
        lines = doc.splitTextToSize(para, textWidth);
      }
      
      // Check space needed for paragraph
      // Line height in mm: (font size in points converted to mm) * spacing
      // 1 point = 0.352778 mm
      const ptToMm = 0.352778;
      const singleLineHeightMm = config.fontSize * ptToMm;
      const spacingMultiplier = config.lineSpacing === 2.0 ? 1.85 : (config.lineSpacing === 1.5 ? 1.45 : 1.15); 
      const lineHeightMm = singleLineHeightMm * spacingMultiplier;
      
      const spaceRequired = lines.length * lineHeightMm;
      
      // If it's the chapter start, we need to account for Chapter titles
      let topPadding = 0;
      if (initialPage) {
        // Heading block takes up ~25mm
        topPadding = 35;
        currentY += topPadding;
      }
      
      // If adding this paragraph exceeds printable area, create a new page
      if (currentY + spaceRequired > height - margin && currentParagraphsInPage.length > 0) {
        // Push the current accumulated page
        chapterPages.push({
          pageNumber: currentPageNum++,
          header: getHeaderString(currentPageNum - 1),
          paragraphs: [...currentParagraphsInPage],
          isChapterStart: initialPage,
          chapterNumber: chapter.number,
          chapterTitle: chapter.title
        });
        
        // Reset state for new page
        currentParagraphsInPage = [];
        currentY = 30; // reset to top (30mm)
        initialPage = false;
      }
      
      currentParagraphsInPage.push(para);
      currentY += spaceRequired + 4; // Add paragraph separation margin
      
      // If it is the chapter start, clear initial page flag so subsequent paragraphs don't get shifted
      if (initialPage && currentParagraphsInPage.length > 0) {
        // Wait till we finalize the page before pushing, but reset local initialPage if we overflow later
      }
    }
    
    // Push the final remaining page of the chapter
    if (currentParagraphsInPage.length > 0) {
      chapterPages.push({
        pageNumber: currentPageNum++,
        header: getHeaderString(currentPageNum - 1),
        paragraphs: [...currentParagraphsInPage],
        isChapterStart: initialPage,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title
      });
    }
    
    pages.push(...chapterPages);
  });
  
  return pages;
}
