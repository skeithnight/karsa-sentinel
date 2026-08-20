# Karsa Sentinel 🛡️

[![npm version](https://img.shields.io/npm/v/karsa-sentinel.svg)](https://www.npmjs.com/package/karsa-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.50-orange.svg)](https://playwright.dev/)

> **Autonomous AI Test Engineering Agent** that transforms product intent into validated, production-ready **Playwright** and **Cucumber BDD** test suites.

---

## 🌟 Product Vision

Karsa Sentinel bridges the gap between high-level product requirements and bulletproof test automation. Given a lightweight requirement document, user story, or reproduction guide, Sentinel autonomously explores the application, designs test cases, generates Gherkin BDD scenarios with Playwright Page Objects, executes the suite, and self-repairs locators upon failure.

### Core Principle: *AI Proposes. Sentinel Verifies.*
The LLM is never the single source of truth. Sentinel continuously verifies all AI proposals through:
- **Zod Schema Validation**
- **DOM & Accessibility Inspection**
- **TypeScript Compilation**
- **Playwright Test Execution & Evidence Capture (Traces / Screenshots)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Intent Document                  │
│                     (Markdown / User Story)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Understand Intent  │
                    └──────────┬──────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │  Explore Web Application  │
                 │      (Playwright DOM)     │
                 └─────────────┬─────────────┘
                               │
                               ▼
                ┌─────────────────────────────┐
                │   Design Tests & Gherkin    │
                │        (BDD Features)       │
                └──────────────┬──────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │   Generate Code & PageObjects │
               │     (Playwright TypeScript)   │
               └───────────────┬───────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │     Execute & Verify      │
                 └─────────────┬─────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
          [On Failure]                   [On Success]
                │                             │
                ▼                             ▼
       ┌─────────────────┐           ┌──────────────────┐
       │   Self-Repair   │           │ Persist Memory & │
       │ (Fix Locators)  │           │ Complete Suite   │
       └─────────────────┘           └──────────────────┘
```

---

## 📦 Installation

### Option 1: Run instantly with `npx` (No installation needed)
```bash
npx karsa-sentinel generate ./docs/examples/login.md
```

### Option 2: Install globally as a CLI tool
```bash
npm install -g karsa-sentinel
karsa-sentinel generate ./docs/examples/login.md --output ./generated
```

### Option 3: Install as a dependency in your project
```bash
npm install karsa-sentinel
```

---

## 🤖 Supported AI Providers

Karsa Sentinel supports pluggable AI provider adapters configured via environment variables or programmatic options:

| Provider | Description | Required Environment Variables |
| :--- | :--- | :--- |
| **9Router** *(Default)* | OpenAI-compatible proxy routing to high-speed models (`mimo`, etc.) | `AI_PROVIDER=9router`<br>`NINE_ROUTER_BASE_URL=http://localhost:20218/v1`<br>`NINE_ROUTER_AUTH_TOKEN=sk-...`<br>`NINE_ROUTER_MODEL=mimo` |
| **OpenAI** | Direct OpenAI API connection | `AI_PROVIDER=openai`<br>`OPENAI_API_KEY=sk-...`<br>`AI_MODEL=gpt-4o` |
| **Google Gemini** | Google Generative AI | `AI_PROVIDER=gemini`<br>`GEMINI_API_KEY=...`<br>`AI_MODEL=gemini-1.5-pro` |
| **Mock** | Deterministic offline provider for local testing and CI/CD pipelines | `AI_PROVIDER=mock` *(fallback if no keys provided)* |

---

## ⚙️ Configuration (`.env`)

Create a `.env` file in your working directory:

```env
# ── AI Provider Configuration ────────────────────────────────
AI_PROVIDER=9router

# ── 9Router AI Proxy ─────────────────────────────────────────
NINE_ROUTER_BASE_URL=http://localhost:20218/v1
NINE_ROUTER_AUTH_TOKEN=sk-your-token-here
NINE_ROUTER_MODEL=mimo

# ── OpenAI / Gemini (Alternative) ───────────────────────────
AI_MODEL=gpt-4o
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# ── Target Application ───────────────────────────────────────
BASE_URL=https://staging.example.com

# ── Playwright Configuration ─────────────────────────────────
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

# ── Agent Configuration ──────────────────────────────────────
MAX_REPAIR_ATTEMPTS=3
MAX_CRAWL_PAGES=20
MAX_CRAWL_DEPTH=3
```

---

## 💻 CLI Usage

```bash
karsa-sentinel generate <documentPath> [options]
```

### Options
- `-o, --output <dir>`: Directory where generated BDD feature and Playwright spec files will be written *(default: `generated`)*.
- `-V, --version`: Output the version number.
- `-h, --help`: Display command options and help.

### Example
```bash
# Generate automation from a Markdown spec
karsa-sentinel generate ./docs/login.md -o ./tests/e2e
```

Output:
```text
🛡️  Karsa Sentinel: Processing intent document: ./docs/login.md
🤖 AI Provider:     9ROUTER

✅ Generation complete!
   - Feature: ./tests/e2e/user-authentication.feature
   - Spec:    ./tests/e2e/user-authentication.spec.ts
```

---

## 🔌 Programmatic API

You can import Karsa Sentinel directly in your TypeScript / JavaScript codebase:

```typescript
import { SentinelOrchestrator, NineRouterProvider } from "karsa-sentinel";

// 1. Initialize Provider
const provider = new NineRouterProvider({
  baseUrl: "http://localhost:20218/v1",
  authToken: "sk-...",
  model: "mimo",
});

// 2. Instantiate Orchestrator
const orchestrator = new SentinelOrchestrator(provider);

// 3. Generate Suite
const result = await orchestrator.generate({
  documentPath: "./docs/examples/login.md",
  outputDirectory: "./generated",
});

console.log(`Feature created at: ${result.featureFile}`);
console.log(`Spec created at:    ${result.specFile}`);
```

---

## 📁 Repository Structure

```text
karsa-sentinel/
├── src/
│   ├── agents/          # Autonomous agents (Orchestrator, Requirement, Explorer, BDD, Repair, etc.)
│   ├── core/            # Zod schemas, TypeScript domain models, contracts, pipeline orchestration
│   ├── crawler/         # Playwright browser context manager, DOM discovery, locator ranking
│   ├── documents/       # Document parsers & registries (Markdown, specs)
│   ├── generators/      # BDD Gherkin & Playwright TypeScript code generators
│   ├── execution/       # Test runner, reporting, and failure triage classification
│   ├── memory/          # Persistent requirement, UI element, and automation artifact memory
│   ├── providers/       # AI provider adapters (9Router, OpenAI, Gemini, Mock)
│   ├── cli/             # CLI executable entry points
│   └── index.ts         # Library exports
├── docs/
│   └── examples/        # Sample requirement documents (e.g. login.md)
├── tests/
│   └── unit/            # Vitest unit tests
├── generated/           # Output directory for generated suites
├── playwright.config.ts # Playwright automation configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

---

## 🛠️ Development & Testing

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run type checker
npm run typecheck

# Build TypeScript to dist/
npm run build
```

---

## 📄 License
[MIT](file:///Users/dwiki.nugraha/dwikicode/karsa-sentinel/LICENSE) © 2026 [skeithnight](https://github.com/skeithnight)
