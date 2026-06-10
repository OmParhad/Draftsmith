# Draftsmith

> **Open Source Typography Studio for Novelists** — Craft, format, and visualize your manuscript with absolute visual and physical alignment, then export pristine, print-ready PDFs.

Draftsmith is a specialized writing interface designed specifically for authors who demand pixel-perfect control over their physical manuscript layout before export. It bridges the gap between active drafting and absolute final layout geometries, offering real-time millimeter-to-pixel conversions matching physical book-building specifications (A4 and US Letter).

---

## 🎨 Design Philosophy

Draftsmith is built for novelists with a high aesthetic bar. It replaces simulated, non-physical web layouts with an **Architecturally Honest virtual stage**. Every element is meticulously calibrated:
- **Absolute Page Scaling**: Select between **A4** and **US Letter** standards, using exact internal mapping to preserve physical layout accuracy.
- **Physical Margin Outlining**: Real-time millimeter guides display narrow (0.75"), standard (1.0"), or wide (1.25") margins corresponding directly to final physical cuts.
- **Novelistic Typography Pairings**: High-contrast, meticulously tracked typefaces including elegant Serifs (Times, Georgia), classic Monospaces (Fira Code/Courier) for drafting, and clean Sans-Serifs (Inter) for modern layouts.
- **Calm, Eye-Safe Palettes**: Switch smoothly between cream parchment, soft white, deep charcoal, and midnight themes.

---

## 🚀 Key Features

### 📖 Perfect Physical Stage Viewer
*   **Exact Millimeter Mapping**: Live mapping of font sizes, paragraph offsets, margins, and paper colors to match raw book metrics.
*   **Aesthetic Running Headers**: Automatic chapter-based running headers rendered with precise serif tracking.
*   **Visual Margin Guides**: Visual dotted lines let you visualize margin boundaries without altering the exported print geometries.
*   **Custom Line Spacing & Indentation**: Full controls over standard spacing ($1.0$, $1.5$, $2.0$) and chapter-start visual indentation rules.

### ✍️ Integrated Chapter Editor
*   **Manuscript Outline Manager**: Add, reorder, or delete chapters directly from the sidebar. Layout math and chapter numbering sequence instantly update.
*   **Real-time Metrics**: Dynamic word-count tracker per-chapter and full manuscript length calculations.
*   **Document Draft Importer**: Append externally compiled text files directly into your manuscript sequence with a single click.

### 📄 Exquisite PDF Export Engine
*   **Pixel-to-Millimeter Conversion**: Built-in export using `jsPDF` that perfectly mirrors the active on-screen typography, line heights, margins, bullet indentations, and chapter starts on a true print-ready layout. No overlapping lines or broken margins.

---

## 🛠️ Diagnostics & GitHub Pages Fix

If you accessed your GitHub repository and saw a blank page with `main.tsx` failing to load, this occurs because **GitHub Pages is serving your raw source code repository instead of the compiled build output**.

Browsers cannot execute raw `.tsx` (TypeScript React) source code directly. You must instruct GitHub Pages to point to the dedicated, compiled branch created by Draftsmith's auto-installer!

### How to Fix in 10 Seconds:

1. **Go to your GitHub Repository** (e.g., `https://github.com/omparhad/Draftsmith`).
2. Click on the ⚙️ **Settings** tab at the top of your repository navigation bar.
3. In the left-hand sidebar, click on 🌐 **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** -> **Source**, make sure **"Deploy from a branch"** is selected.
5. Under **Branch**:
   * Change the dropdown selection from `main` or `/ (root)` to **`gh-pages`** 🌟.
   * Keep the folder dropdown set as `/ (root)`.
6. Click **Save**.

Within 1-2 minutes, GitHub Pages will deploy your compiled site. Your custom GitHub Actions runner (configured in `.github/workflows/deploy.yml`) will automatically handle all future updates seamlessly!

---

## 💻 Local Installation

Get Draftsmith running in your local studio in moments:

### 1. Clone & Enter the Directory
```bash
git clone https://github.com/omparhad/Draftsmith.git
cd Draftsmith
```

### 2. Install Studio Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📦 Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler & Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Micro-Animations**: Motion / Framer Motion
- **PDF Core**: jsPDF
- **Icons**: Lucide React
