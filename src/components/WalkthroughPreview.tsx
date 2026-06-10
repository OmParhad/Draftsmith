import React from 'react';
import { 
  FileText, Sparkles, BookMarked, Layers, Plus, Trash2, 
  Settings, PenTool, Download, BookOpen, AlertCircle
} from 'lucide-react';

interface WalkthroughPreviewProps {
  slideIndex: number;
}

export const WalkthroughPreview: React.FC<WalkthroughPreviewProps> = ({ slideIndex }) => {
  if (slideIndex === 0) {
    // Stage 1: No Active Manuscript Setup
    return (
      <div className="w-full h-full bg-[#FAF9F5] p-4 flex flex-col md:flex-row gap-4 text-left font-sans select-none animate-fade-in text-[#1A1A1A] text-[11px] overflow-hidden">
        {/* Left Library Mockup */}
        <div className="w-full md:w-1/3 border border-dashed border-polish-border bg-[#F5F2EB] p-3 rounded-lg flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-polish-border pb-1.5">
              <span className="font-bold flex items-center gap-1 uppercase tracking-wider text-[9px] text-[#706E6B]">
                <BookOpen className="w-3 h-3 text-[#1A1A1A]" /> Novel Library
              </span>
              <span className="px-1.5 py-0.5 bg-polish-dark text-white rounded text-[8px] font-bold">
                + ADD
              </span>
            </div>
            <div className="text-[#8D8A85] text-center py-6 border border-dashed border-polish-border/60 rounded italic text-[10px]">
              No active manuscripts drafted.
            </div>
          </div>
          
          <div className="bg-white border border-polish-border p-2 rounded text-[9px] space-y-1.5 shadow-xs">
            <span className="font-bold text-[#E56C3B] uppercase tracking-wider block">
              Safeguard & Backups
            </span>
            <p className="text-[#706E6B] leading-normal text-[8.5px]">
              Draftsmith is <strong>100% offline-first & open-source</strong>. None of your novels are uploaded to any server.
            </p>
          </div>
        </div>

        {/* Right Active Workspace Initial Form Mockup */}
        <div className="flex-1 bg-white border border-polish-border p-4 rounded-lg flex flex-col items-center justify-center relative min-h-[220px]">
          {/* Virtual Canvas Dotted Margin Guide */}
          <div className="absolute inset-2 border border-dotted border-polish-border/40 pointer-events-none rounded"></div>
          
          <div className="w-full max-w-sm space-y-4 z-10 text-center">
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-full border border-polish-border flex items-center justify-center mx-auto text-[#1A1A1A]">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">No Active Manuscript</h4>
              <p className="text-[9.5px] text-[#706E6B] max-w-[240px] mx-auto leading-normal">
                Initialize a clean typesetting project. Fill out the details below.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-polish-border p-3 rounded-lg text-left space-y-2.5 shadow-xs">
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-[#706E6B] mb-1">
                  Novel Title *
                </span>
                <div className="w-full p-1.5 bg-white border border-polish-border rounded text-[10px] text-[#8D8A85] font-serif">
                  e.g. THE EMERALD CHRONICLES
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-[#706E6B] mb-1">
                    Subtitle / Vol
                  </span>
                  <div className="w-full p-1.5 bg-white border border-polish-border rounded text-[10px] text-[#8D8A85] font-serif">
                    e.g. Volume One
                  </div>
                </div>
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-[#706E6B] mb-1">
                    Author Name
                  </span>
                  <div className="w-full p-1.5 bg-white border border-polish-border rounded text-[10px] text-[#8D8A85] font-serif">
                    e.g. Jane Austen
                  </div>
                </div>
              </div>

              <div className="w-full py-1.5 bg-[#1A1A1A] hover:bg-black text-[9px] font-sans font-bold text-white uppercase tracking-widest rounded text-center cursor-pointer shadow-xs mt-1 transition-colors">
                + Start Typesetting Manuscript
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slideIndex === 1) {
    // Stage 2: Page Sheet Previewer & Manuscript Matrix
    return (
      <div className="w-full h-full bg-[#FAF9F5] p-3 flex flex-col md:flex-row gap-3 text-left font-sans select-none animate-fade-in text-[#1A1A1A] text-[10px] overflow-hidden">
        {/* Left Side: Controls Rail */}
        <div className="w-full md:w-1/3 border border-polish-border bg-[#F5F2EB] p-2 rounded-lg flex flex-col justify-between space-y-2.5">
          <div className="space-y-2">
            <div className="border-b border-polish-border pb-1 font-bold text-[9px] uppercase tracking-wider text-[#706E6B] flex items-center gap-1">
              <Settings className="w-3 h-3 text-[#1A1A1A]" /> Manuscript Matrix
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] uppercase tracking-wider text-[#706E6B] font-semibold">Book Title</span>
              <div className="p-1 px-1.5 bg-white border border-polish-border rounded text-[#1A1A1A] font-serif text-[9px] leading-tight">
                hello
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] uppercase tracking-wider text-[#706E6B] font-semibold">Font Family</span>
              <div className="grid grid-cols-3 gap-1">
                <span className="py-0.5 rounded border border-polish-dark bg-[#1A1A1A] text-white text-[7.5px] font-bold uppercase text-center cursor-pointer">
                  Times
                </span>
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  Courier
                </span>
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  Sans
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] uppercase tracking-wider text-[#706E6B] font-semibold">Line Spacing</span>
              <div className="grid grid-cols-3 gap-1">
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  1.15x
                </span>
                <span className="py-0.5 rounded border border-polished-dark bg-[#1A1A1A] text-white text-[7.5px] font-bold uppercase text-center cursor-pointer">
                  1.5x
                </span>
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  2.0x
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[7.5px] uppercase tracking-wider text-[#706E6B] font-semibold">Page Margin</span>
              <div className="grid grid-cols-3 gap-1">
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  0.75"
                </span>
                <span className="py-0.5 rounded border border-polished-dark bg-[#1A1A1A] text-white text-[7.5px] font-bold uppercase text-center cursor-pointer">
                  1.0"
                </span>
                <span className="py-0.5 rounded border border-polish-border bg-white text-[#706E6B] text-[7.5px] uppercase text-center cursor-pointer">
                  1.25"
                </span>
              </div>
            </div>
          </div>

          <div className="p-1 px-1.5 bg-white border border-polish-border rounded text-[7.5px] text-[#706E6B] leading-relaxed">
            Format parameters dynamically reconstruct physical Letter or A4 dimensions.
          </div>
        </div>

        {/* Right Side: Virtual Double Page Spread Mockup */}
        <div className="flex-1 bg-white border border-polish-border p-2.5 rounded-lg flex flex-col justify-between space-y-2 relative">
          <div className="flex justify-between items-center border-b border-polish-border pb-1 text-[8.5px] text-[#706E6B]">
            <span className="font-bold text-[#1A1A1A] flex items-center gap-1 uppercase tracking-wider">
              <BookMarked className="w-3 h-3 text-[#1A1A1A]" /> Live Page Preview
            </span>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 bg-white border border-polish-border text-[#1A1A1A] text-[7.5px] rounded font-bold">White</span>
              <span className="px-1.5 py-0.5 bg-[#FDFBF7] border border-polish-dark text-[#1A1A1A] text-[7.5px] rounded font-bold shadow-xs">Cream</span>
              <span className="px-1.5 py-0.5 bg-white border border-polish-border text-[#706E6B] text-[7.5px] rounded">Sepia</span>
            </div>
          </div>

          <div className="flex-1 flex gap-3 items-center justify-center relative min-h-[160px] p-2 bg-[#F6F5F2]">
            {/* Nav Arrows */}
            <span className="w-5 h-5 rounded-full bg-white border border-polish-border flex items-center justify-center text-[#706E6B] text-[9px] shadow-sm select-none cursor-pointer">
              &lsaquo;
            </span>

            {/* Virtual Book Sheet Canvas */}
            <div className="w-[120px] aspect-[1/1.4] bg-[#FAF9F5] border border-polish-border/80 shadow-md p-3 relative flex flex-col justify-between text-center font-serif text-[#1A1A1A] rounded-[2px] transition-all hover:scale-[1.02]">
              {/* Virtual Header */}
              <div className="border-b border-polish-border/40 pb-0.5 text-[6px] tracking-widest uppercase text-[#706E6B]">
                hello
              </div>

              {/* Centered content */}
              <div className="my-auto space-y-1">
                <h3 className="text-xs font-bold leading-none tracking-wider font-serif">HELLO</h3>
                <p className="text-[6.5px] italic text-[#706E6B]">Volume I</p>
                <div className="w-6 h-[1px] bg-polish-border/60 mx-auto my-1.5"></div>
                <div className="text-[5.5px] tracking-widest text-[#706E6B] uppercase font-sans">
                  — Manuscript Format —
                </div>
              </div>

              {/* Virtual Author footer */}
              <div className="text-[6px] font-bold uppercase tracking-wider text-[#1A1A1A] leading-tight">
                By Unknown Author
                <div className="text-[4.5px] font-serif italic text-[#706E6B] font-normal tracking-wide mt-0.5">
                  Draft Class Standard
                </div>
              </div>
            </div>

            <span className="w-5 h-5 rounded-full bg-white border border-polish-border flex items-center justify-center text-[#706E6B] text-[9px] shadow-sm select-none cursor-pointer">
              &rsaquo;
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (slideIndex === 2) {
    // Stage 3: Direct Chapters Manager and Text Editor
    return (
      <div className="w-full h-full bg-[#FAF9F5] p-3 flex flex-col md:flex-row gap-3 text-left font-sans select-none animate-fade-in text-[#1A1A1A] text-[10px] overflow-hidden">
        {/* Left Side: Chapter Sidebar */}
        <div className="w-full md:w-1/3 border border-polish-border bg-[#F5F2EB] p-2.5 rounded-lg flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-polish-border pb-1 font-bold text-[8.5px] uppercase tracking-wider text-[#706E6B]">
              <span>Chapters Mapping</span>
              <span className="px-1.5 py-0.5 bg-white border border-polish-border text-[7px] text-[#1A1A1A] rounded font-bold shadow-xs">
                + Add
              </span>
            </div>

            {/* Simulated Active Chapter list */}
            <div className="space-y-1">
              <div className="w-full p-2 bg-white border border-polish-border rounded font-bold flex flex-col gap-0.5 shadow-xs relative">
                <span className="text-[7.5px] font-sans font-bold uppercase text-[#E56C3B]">Chapter One</span>
                <span className="text-[9px] font-serif italic text-[#1A1A1A] truncate">The Opening Chapter</span>
                <span className="text-[7.5px] font-mono text-[#8D8A85] flex items-center gap-0.5 mt-1">
                  <FileText className="w-2.5 h-2.5 text-[#1A1A1A]" /> 38 words
                </span>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 bg-red-50 border border-red-100 rounded text-[7px] cursor-pointer" title="Delete button">
                  <Trash2 className="w-2.5" />
                </span>
              </div>

              <div className="w-full p-2 bg-transparent text-[#706E6B] hover:bg-black/5 rounded flex flex-col gap-0.5 cursor-pointer">
                <span className="text-[7.5px] font-sans font-bold uppercase">Chapter Two</span>
                <span className="text-[9px] font-serif truncate">Untitled Chapter</span>
                <span className="text-[7.5px] font-mono flex items-center gap-0.5 mt-1">
                  <FileText className="w-2.5 h-2.5" /> 0 words
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[7.5px] text-[#706E6B] font-mono">
              MANUSCRIPT LENGTH: <strong className="text-[#1A1A1A] font-bold">38 WORDS</strong>
            </div>
            <div className="w-full py-1 bg-white border border-polish-border text-[#1A1A1A] rounded text-[8px] font-sans font-bold text-center uppercase tracking-wider cursor-pointer shadow-xs hover:bg-[#FAF9F5]">
              + Add Blank Chapter
            </div>
            <div className="w-full py-1 bg-[#1A1A1A] text-white rounded text-[8px] font-sans font-semibold text-center uppercase tracking-wider cursor-pointer shadow-xs hover:bg-black">
              &uarr; Import Draft PDF / TXT
            </div>
          </div>
        </div>

        {/* Right Side: Chapter Editor Panel */}
        <div className="flex-1 bg-white border border-polish-border p-3 rounded-lg flex flex-col justify-between space-y-2 relative">
          <div className="flex justify-between items-center border-b border-polish-border pb-1">
            <div className="flex items-center gap-1 font-bold text-[8.5px] uppercase tracking-wider text-[#706E6B]">
              <PenTool className="w-3 h-3 text-[#1A1A1A]" /> Manuscript Editor
            </div>
            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[7px] rounded uppercase font-bold tracking-wider">
              Saved Draft
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[7.5px] uppercase font-bold tracking-wider text-[#706E6B]">Chapter Display Title</span>
            <div className="w-full p-1.5 bg-[#FAF9F5] border border-polish-border rounded font-serif text-[10px] text-[#1A1A1A] font-bold">
              The Opening Chapter
            </div>
          </div>

          <div className="space-y-1 flex-1 flex flex-col justify-start">
            <div className="flex justify-between items-center">
              <span className="text-[7.5px] uppercase font-bold tracking-wider text-[#706E6B]">Interactive Text Content</span>
              <span className="text-[7.5px] font-mono text-[#8D8A85]">38 words</span>
            </div>
            <div className="flex-1 bg-[#FAF9F5]/40 border border-polish-border p-2.5 rounded font-serif text-[9.5px] leading-relaxed text-[#1A1A1A]_ leading-[15px] max-h-[90px] overflow-y-auto">
              In the quiet expanse of the room, the blank sheets of parchment sat like white sails waiting for a wind. Here begins the new manuscript chronicle.
              <br/><br/>
              Edit this draft standard to construct chapter flows, margins, and type specifications.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slideIndex === 3) {
    // Stage 4: Publish & Download Bundle Export
    return (
      <div className="w-full h-full bg-[#FAF9F5] p-4 flex flex-col justify-between space-y-3 text-left font-sans select-none animate-fade-in text-[#1A1A1A] text-[10.5px]">
        {/* Export Card */}
        <div className="bg-white border border-polish-border p-4 rounded-xl shadow-xs space-y-3 flex-1 flex flex-col justify-between relative">
          <div className="absolute top-2 right-2 flex items-center justify-center p-1 rounded-full bg-[#FAF9F5] border border-polish-border text-[#706E6B]">
            <Download className="w-3.5 h-3.5" />
          </div>
          
          <div className="space-y-1 border-b border-polish-border pb-2 max-w-sm">
            <h4 className="text-xs font-serif font-bold text-[#1A1A1A] uppercase tracking-wide">Publish & Download Bundle</h4>
            <p className="text-[9.5px] text-[#706E6B] leading-normal">
              Assemble print-ready vector manuscripts and folio sets.
            </p>
          </div>

          {/* Form Fields Card */}
          <div className="bg-[#FAF9F5] border border-polish-border p-3.5 rounded-lg space-y-3 shadow-xs">
            <span className="block text-[8px] font-bold uppercase tracking-widest text-[#706E6B] border-b border-polish-border/40 pb-1">
              Export Layout Parameters
            </span>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-[#706E6B] mb-1">
                  Author Lastname (Header)
                </span>
                <div className="w-full p-1.5 bg-white border border-polish-border rounded text-[10px] text-[#1A1A1A] font-medium uppercase font-serif">
                  AUTHOR
                </div>
              </div>
              <div>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-[#706E6B] mb-1">
                  Short Book Title (Header)
                </span>
                <div className="w-full p-1.5 bg-white border border-polish-border rounded text-[10px] text-[#1A1A1A] font-medium uppercase font-serif font-bold">
                  HELLO
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 font-sans text-[8px] uppercase tracking-wider text-[#706E6B]">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[7px] text-[#8D8A85]">Line Spacing</span>
                <span className="text-[#1A1A1A] font-bold">Standard (1.5x)</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[7px] text-[#8D8A85]">Font Family</span>
                <span className="text-[#1A1A1A] font-bold font-serif">Times New Roman</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[7px] text-[#8D8A85]">Page Format</span>
                <span className="text-[#1A1A1A] font-bold">Letter | Standard</span>
              </div>
            </div>
          </div>

          <div className="w-full py-2 bg-[#1A1A1A] hover:bg-black text-[10px] font-sans font-bold text-white uppercase tracking-widest rounded text-center cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-1">
            <Download className="w-3.5 h-3.5" /> Compile & Export PDF File
          </div>
        </div>

        {/* Footnote instruction block */}
        <div className="bg-white border border-polish-border p-2.5 rounded-lg flex gap-2 items-start shadow-xs text-[#75726D]">
          <AlertCircle className="w-3.5 h-3.5 text-[#E56C3B] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[8.5px] uppercase tracking-wider text-[#1A1A1A] block">Manuscript Standard Guidelines</span>
            <p className="text-[8px] leading-normal text-[#706E6B]">
              Standard literary submissions require precise double-spacing, running headers with author last name, and clear chapter divisions. This studio automates pages instantly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
