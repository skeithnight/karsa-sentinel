# 🛡️ Karsa Sentinel

> Autonomous QA automation agent: Transforms product intent into Playwright BDD test suites with live DOM discovery and self-healing.

[![npm version](https://img.shields.io/npm/v/karsa-sentinel.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/karsa-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/playwright-1.50-green?style=flat-square)](https://playwright.dev/)

---

## ⚡ Quick Start in 3 Steps

### 1. Initialize your project
```bash
npx karsa-sentinel init
```
*Scaffolds `playwright.config.ts` (with HTML reporting), creates `.env.example`, starter specs, and npm scripts.*

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

### 3. Generate & Run Automation
```bash
# Generate BDD Feature, Page Objects & Playwright Spec from Markdown
npm run generate

# Run tests with Autonomous Self-Healing
npm test

# Open interactive HTML report
npm run report
```

---

## 💻 CLI Commands

| Command | Description | Example |
| :--- | :--- | :--- |
| `karsa-sentinel init` | Configure workspace with Playwright & sample specs | `npx karsa-sentinel init` |
| `karsa-sentinel generate <doc>` | Generate BDD & Playwright tests from Markdown doc | `npx karsa-sentinel generate ./docs/login.md` |
| `karsa-sentinel generate <doc> -d` | Generate with real-time debug log tracing | `npx karsa-sentinel generate ./docs/login.md -d` |
| `karsa-sentinel run` | Execute test suite with autonomous locator self-healing | `npx karsa-sentinel run` |

### CLI Options for `generate`:
- `-d, --debug`: Enable real-time debug logging (HTTP calls, token counts, DOM discovery).
- `-o, --output <dir>`: Output directory *(default: `generated`)*.
- `-p, --provider <name>`: Override AI provider (`9router` \| `openai` \| `gemini` \| `mock`).
- `-m, --model <name>`: Override AI model name (e.g. `mimo`, `gpt-4o`).
- `--skip-crawl`: Skip live browser DOM exploration.

---

## 🔌 Programmatic Usage

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
});

console.log("Spec created at:", result.specFile);
console.log("Page Object created at:", result.pageObjectFile);
```

---

## 📚 Full Documentation & Architecture
For deep architectural blueprints, Graphify knowledge graphs, and contributor guides, visit the [GitHub Repository](https://github.com/skeithnight/karsa-sentinel).

## 📄 License
[MIT](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE) © [skeithnight](https://github.com/skeithnight)
