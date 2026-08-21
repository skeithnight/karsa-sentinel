<div align="center">

<img src="https://raw.githubusercontent.com/skeithnight/karsa-sentinel/main/assets/logo.png" alt="Karsa Sentinel Logo" width="200" />

# 🛡️ Karsa Sentinel

**Autonomous AI QA Automation Agent & Enterprise BDD Test Generator**

*AI Proposes. Sentinel Verifies.*

[![npm version](https://img.shields.io/npm/v/karsa-sentinel.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/karsa-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/playwright-1.50%2B-green?style=flat-square)](https://playwright.dev/)
[![playwright-bdd](https://img.shields.io/badge/playwright--bdd-9.2-purple?style=flat-square)](https://vitalets.github.io/playwright-bdd/)

</div>

---

## 🌟 What is Karsa Sentinel?

**Karsa Sentinel** is an autonomous AI agent that transforms human-readable requirements (Markdown, PRDs, Jira specs) into enterprise-grade **Playwright BDD test automation suites**. 

It crawls your live web application, extracts resilient DOM locators, designs test matrices using LLMs, resolves semantic actions via scored confidence matching, and generates production-ready **Gherkin Features**, **Page Objects extending `BasePage`**, **Step Definitions (`createBdd`)**, and **Custom Fixtures (`test.extend`)** with **live headless browser self-healing verification**.

---

## 🏛️ Enterprise Architecture & Execution Flow

<div align="center">

<img src="https://raw.githubusercontent.com/skeithnight/karsa-sentinel/main/assets/karsa-sentinel-visualize.png" alt="Karsa Sentinel Architecture & Execution Flow" width="100%" />

</div>

---

## ⚡ Quick Start in 3 Steps

### 1. Initialize your project
```bash
npx karsa-sentinel init
```
*Scaffolds `playwright.config.ts` (with `playwright-bdd` & HTML reports), `src/pages/base.page.ts`, `src/fixtures/base.fixture.ts`, `.env.example`, and npm scripts.*

### 2. Configure AI Provider in `.env`
```env
# ── 9Router Proxy (Default) ──────────────────────────────────
AI_PROVIDER=9router
NINE_ROUTER_BASE_URL=http://localhost:20218/v1
NINE_ROUTER_AUTH_TOKEN=sk-your-token-here
NINE_ROUTER_MODEL=mimo

# ── Target Web Application ───────────────────────────────────
BASE_URL=https://www.saucedemo.com
```

### 3. Generate & Run Enterprise BDD Tests
```bash
# Generate Gherkin Features, Typed Page Objects, Fixtures & Step Definitions
npm run generate

# Run tests (auto-compiles BDD and executes with Playwright)
npm test

# Open interactive HTML report
npm run report
```

---

## 🏗️ Generated Enterprise Architecture

When running in **Enterprise Mode** (default), Karsa Sentinel generates a clean, modular structure:

```text
my-project/
├── features/                      # 🥒 Gherkin Feature Specifications
│   └── user-authentication.feature
├── src/
│   ├── fixtures/
│   │   └── base.fixture.ts        # 💉 Typed Page Object Dependency Injection (test.extend)
│   ├── pages/
│   │   ├── base.page.ts           # 🏛️ Abstract BasePage (navigate, getErrorMessage, getTitleText)
│   │   └── user-authentication.page.ts # 📦 Typed Locators & Action Methods (login, isLoaded)
│   └── steps/
│       └── user-authentication.steps.ts # 🪜 Parameterized Step Definitions (createBdd)
├── generated/                     # 📜 Standalone Playwright Spec (.spec.ts fallback)
├── playwright.config.ts           # ⚙️ defineBddConfig & Cucumber HTML Reporter
└── .env.example
```

---

## 💻 CLI Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| `karsa-sentinel init` | Initialize workspace with Enterprise BDD config, BasePage & fixtures | `npx karsa-sentinel init` |
| `karsa-sentinel generate <doc>` | Generate Enterprise BDD suite (features, pages, steps, fixtures) | `npx karsa-sentinel generate ./docs/login.md` |
| `karsa-sentinel generate <doc> --mode=standalone` | Generate single flat `.spec.ts` without full folder structure | `npx karsa-sentinel generate ./docs/login.md --mode=standalone` |
| `karsa-sentinel generate <doc> -d` | Generate with real-time DOM & AI debug tracing | `npx karsa-sentinel generate ./docs/login.md -d` |
| `karsa-sentinel run` | Execute test suite with autonomous live repair loop | `npx karsa-sentinel run` |

### CLI Options for `generate`:
- `-m, --mode <mode>`: Generation mode: `enterprise` (default) \| `standalone`.
- `-d, --debug`: Enable real-time debug logging (HTTP calls, token counts, DOM discovery).
- `-o, --output <dir>`: Output directory *(default: `generated`)*.
- `-p, --provider <name>`: Override AI provider (`9router` \| `openai` \| `gemini` \| `mock`).
- `--model <name>`: Override AI model name (e.g. `mimo`, `gpt-4o`).
- `--skip-crawl`: Skip live browser DOM exploration.

---

## 🔌 Programmatic TypeScript API

```typescript
import { SentinelOrchestrator, NineRouterProvider } from "karsa-sentinel";

const provider = new NineRouterProvider({
  baseUrl: "http://localhost:20218/v1",
  authToken: "sk-...",
  model: "mimo",
});

const orchestrator = new SentinelOrchestrator(provider);
const result = await orchestrator.generate({
  documentPath: "./docs/login.md",
  mode: "enterprise",
});

console.log("Feature:    ", result.featureFile);
console.log("Steps:      ", result.stepFile);
console.log("Page Object:", result.pageObjectFile);
console.log("Fixture:    ", result.fixtureFile);
```

---

## 📚 Documentation & Repository
For architectural blueprints, autonomous self-healing details, and contributor guides, visit the [GitHub Repository](https://github.com/skeithnight/karsa-sentinel).

## 📄 License
[MIT](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE) © [skeithnight](https://github.com/skeithnight)
