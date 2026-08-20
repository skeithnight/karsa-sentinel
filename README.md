# 🛡️ Karsa Sentinel

**Autonomous AI QA Automation Agent & Intent-to-Execution Engine**

*AI Proposes. Sentinel Verifies.*

[![npm version](https://img.shields.io/npm/v/karsa-sentinel.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/karsa-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/playwright-1.50-green?style=flat-square)](https://playwright.dev/)

---

## 📖 Overview

**Karsa Sentinel** is a deterministic, agentic QA engineering system that autonomously converts natural language product intent documents (Markdown, PRDs, Jira specs) into resilient **BDD Gherkin features**, **Playwright Page Objects**, and **executable test suites**.

```text
  ┌────────────────────────┐       ┌────────────────────────┐
  │  Product Intent (Doc)  │  ──▶  │   Karsa Sentinel Core  │
  └────────────────────────┘       └───────────┬────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
  │   Live DOM Discovery   │      │ 1:1 Scenario Specs     │      │   Interactive HTML     │
  │  (Resilient Locators)  │      │   & Page Objects       │      │   & Failure Reports    │
  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Zero-Config Project Initialization
```bash
npx karsa-sentinel init
```
*Automatically configures `playwright.config.ts` (with HTML reporting), creates `.env.example`, adds starter specs, and injects package scripts.*

### 2. Generate Tests from Requirement
```bash
npx karsa-sentinel generate ./docs/login.md
```

### 3. Run in Verbose Debug Mode (`-d`)
```bash
npx karsa-sentinel generate ./docs/login.md -d
```

### 4. Execute Tests & View HTML Reports
```bash
npm test
npm run report
```

---

## 🤖 Supported AI Providers

Karsa Sentinel supports pluggable AI provider adapters configured via environment variables or CLI flags:

| Provider | Description | Required Environment Variables |
| :--- | :--- | :--- |
| **9Router** *(Default)* | OpenAI-compatible proxy routing to high-speed models (`mimo`, etc.) | `AI_PROVIDER=9router`<br>`NINE_ROUTER_BASE_URL=http://localhost:20218/v1`<br>`NINE_ROUTER_AUTH_TOKEN=sk-...`<br>`NINE_ROUTER_MODEL=mimo` |
| **OpenAI** | Direct OpenAI API connection | `AI_PROVIDER=openai`<br>`OPENAI_API_KEY=sk-...`<br>`AI_MODEL=gpt-4o` |
| **Google Gemini** | Google Generative AI | `AI_PROVIDER=gemini`<br>`GEMINI_API_KEY=...`<br>`AI_MODEL=gemini-1.5-pro` |
| **Mock** | Deterministic offline provider for local testing and CI/CD pipelines | `AI_PROVIDER=mock` *(fallback if no keys provided)* |

---

## ⚙️ Configuration (`.env`)

```env
# ── AI Provider Configuration ────────────────────────────────
AI_PROVIDER=9router

# ── 9Router AI Proxy ─────────────────────────────────────────
NINE_ROUTER_BASE_URL=http://localhost:20218/v1
NINE_ROUTER_AUTH_TOKEN=sk-your-token-here
NINE_ROUTER_MODEL=mimo

# ── Target Application ───────────────────────────────────────
BASE_URL=https://www.saucedemo.com

# ── Playwright Configuration ─────────────────────────────────
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

# ── Debug Logging ────────────────────────────────────────────
DEBUG=false # Set to true or pass -d CLI flag
```

---

## 💻 CLI Commands & Options

### `karsa-sentinel init`
Initializes current workspace with Playwright configuration, HTML reports, and sample specs.
```bash
karsa-sentinel init [-d]
```

### `karsa-sentinel generate <documentPath>`
Generates BDD scenarios, Page Objects, and Playwright tests from an intent document.
```bash
karsa-sentinel generate <documentPath> [options]
```

#### Options:
- `-d, --debug`: **Enable detailed debug mode with verbose log tracing** (traces HTTP requests, prompt previews, token usage, DOM discovery, and AST extraction).
- `-o, --output <dir>`: Directory where generated files will be written *(default: `generated`)*.
- `-p, --provider <name>`: Override AI provider (`9router` | `openai` | `gemini` | `mock`).
- `-m, --model <name>`: Override AI model name (e.g. `mimo`, `gpt-4o`).
- `--skip-crawl`: Skip live browser DOM exploration.

### `karsa-sentinel run [testPath]`
Executes Playwright tests with autonomous failure analysis.
```bash
karsa-sentinel run [testPath] [-r, --repair] [-d, --debug]
```

---

## 🔌 Programmatic API

```typescript
import { SentinelOrchestrator, NineRouterProvider, logger } from "karsa-sentinel";

// Enable verbose logging programmatically
logger.setDebug(true);

const provider = new NineRouterProvider({
  baseUrl: "http://localhost:20218/v1",
  authToken: "sk-...",
  model: "mimo",
});

const orchestrator = new SentinelOrchestrator(provider);
const result = await orchestrator.generate({
  documentPath: "./docs/login.md",
  outputDirectory: "./generated",
});

console.log("Generated Spec:", result.specFile);
console.log("Generated Page Object:", result.pageObjectFile);
```

---

## 📄 License
[MIT](LICENSE) © [skeithnight](https://github.com/skeithnight)
