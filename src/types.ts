export interface ManuscriptConfig {
  title: string;
  subtitle: string;
  authorName: string;
  authorLastName: string;
  shortTitle: string;
  fontFamily: 'times' | 'courier' | 'helvetica';
  lineSpacing: 1.15 | 1.5 | 2.0;
  fontSize: number;
  letterSpacing: string;
  marginSize: 'standard' | 'narrow' | 'wide'; // 1 inch, 0.75 inch, 1.25 inch
  pageSize: 'letter' | 'a4';
  paperColor: 'white' | 'cream' | 'dark' | 'sepia';
  chapterDesign: 'classic' | 'modern' | 'minimalist';
}

export interface Chapter {
  id: string;
  number: string; // e.g. "CHAPTER ONE"
  title: string; // e.g. "The Last Breath of KPX-3039"
  content: string; // raw markdown/text content
}

export interface Novel {
  id: string;
  title: string;
  config: ManuscriptConfig;
  chapters: Chapter[];
}

export interface PageLayout {
  pageNumber: number;
  header: string; // e.g., "Hound / THE SUMMER HUNTING / 2"
  paragraphs: string[];
  isChapterStart?: boolean;
  chapterNumber?: string;
  chapterTitle?: string;
  isTitlePage?: boolean;
}
