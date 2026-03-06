<div align="center">
  <img src="https://img.icons8.com/isometric/120/code.png" alt="Logo" width="80" height="80">
  <h1 align="center">WhiteBox Analyzer AI</h1>
  <p align="center">
    <strong>A Next.js Application that leverages Google Gemini AI to instantly generate Control Flow Graphs (CFG), calculate Cyclomatic Complexity, and draft Unit Test Cases directly from Source Code.</strong>
    <br />
    <br />
    <a href="https://whitebox-analyzer.vercel.app/"><strong>🔥 View Live Demo »</strong></a>
    <br />
    <br />
  </p>
</div>

---

## 🌟 Introduction

Welcome to **WhiteBox Analyzer AI**! This project was built to solve a core challenge in Software Quality Assurance (QA): visually plotting nested logic branches and ensuring edge cases are properly tested. By pasting any raw code snippet (Java, C++, TS, Python, etc.) into the editor, this application autonomously maps its logical topography using interactive **Mermaid.js** charts and standardizes **Branch Coverage** tracking.

## 🚀 Key Features

* **LLM-Powered Syntax Analysis**: Integrates the `Google Gemini 2.0 Flash` model to safely and statically analyze raw code inputs across different languages without needing a local compiler.
* **Interactive Control Flow Graphs (CFG)**: Automatically draws a node-by-node Execution Map using Mermaid.js. 
    * 🗺️ Features **Pan & Zoom** (`react-zoom-pan-pinch`) for navigating heavily nested or enterprise logic files.
    * 🖱️ **Floating Context Tooltips**: Hover over any node block to dynamically view the precise source code snippet executing in that particular step.
* **Cyclomatic Complexity Calculus**: Automatically calculates `V(G) = P + 1` (Edges - Nodes + 2) to give an instant structural hazard score.
* **Automated QA Test Case Generation**: Produces a comprehensive, tabular matrix of recommended Test Cases highlighting edge cases, required inputs, paths covered, and expected outputs.
* **Responsive, Modern UI**: Built with pure React `Tailwind CSS`, incorporating dark-mode sleekness and smooth loading state transitions.

---

## 🛠️ Technical Stack

- **Frontend framework**: Next.js 14+ (App Router, Turbopack)
- **Styling**: Tailwind CSS & Lucide Icons
- **Interactive UI**: `react-zoom-pan-pinch`, Mermaid.js
- **Backend Infrastructure**: Next.js Serverless API Routes
- **Artificial Intelligence**: Google Generative AI (`@google/generative-ai` SDK)
- **Deployment**: Vercel CI/CD Pipeline

## 👨‍💻 Quick Start (Local Development)

If you'd like to run this application locally on your machine:

**1. Clone the repository**
```bash
git clone https://github.com/NguyenHoangAn12032004/whitebox-analyzer.git
cd whitebox-analyzer
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Rename `.env.local.example` to `.env.local` (or create a new file) and provide your Google AI Studio API Key:
```env
GEMINI_API_KEY="AIzaSy...your-secret-key"
```

**4. Start the Development Server**
```bash
npm run dev
```
Open `http://localhost:3000` with your browser to see the result.

---

## 🎯 Example Use Case
*Paste a complex discount calculator function...*
![Preview of the interactive map analysis](public/showcase.png) <!-- *Placeholder for repository screenshot if manually added* -->

The system instantly plots the nodes deciding between `%10`, `%20` or VIP member permutations, calculating exactly 6 independent testing states.

---

## ✨ Motivation
This project was developed to strongly demonstrate my proficiency in translating manual QA methodologies into automated, scalable SAAS tools. It highlights my full-stack capability crossing UI/UX (React map tracking, CSS design) deeply intertwined with Serverless architecture and bleeding-edge LLM prompt engineering. 

I am highly passionate about Software Testing, Automation, and Web Development! 

> 💡 *Feel free to reach out via GitHub to examine my technical background for upcoming Internship opportunities!*
