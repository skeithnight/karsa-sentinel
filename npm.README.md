<div align="center">

<img src="https://raw.githubusercontent.com/skeithnight/karsa-sentinel/main/assets/logo.png" alt="Karsa Sentinel Logo" width="200" />

# 🛡️ Karsa Sentinel

### Autonomous AI QA Automation Agent
### **From Product Intent → Verified Automation**

*AI Proposes. Sentinel Verifies.*

[![npm version](https://img.shields.io/npm/v/karsa-sentinel.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/karsa-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/playwright-1.50%2B-green?style=flat-square)](https://playwright.dev/)
[![playwright-bdd](https://img.shields.io/badge/playwright--bdd-9.2-purple?style=flat-square)](https://vitalets.github.io/playwright-bdd/)

[GitHub](https://github.com/skeithnight/karsa-sentinel) · [npm](https://www.npmjs.com/package/karsa-sentinel)

</div>

---

## 🌟 What is Karsa Sentinel?

**Karsa Sentinel** is an autonomous AI agent that transforms human-readable requirements (Markdown, PRDs, Jira specs) into enterprise-grade **Playwright BDD test automation suites**. 

Provide a requirement document and a target application URL, and Sentinel will:

```text
📄 Understand Product Requirements
        ↓
🔎 Explore the Live Application
        ↓
🧠 Collect Real UI Evidence
        ↓
🧪 Design Test Scenarios
        ↓
🥒 Generate Gherkin BDD Specifications
        ↓
🧭 Resolve Actions to Real UI Elements
        ↓
⚙️ Generate Playwright + TypeScript (POM, Steps, Fixtures)
        ↓
▶️ Execute and Verify on Live Browser
```

> **AI proposes automation decisions. Sentinel verifies them against real application evidence.**

---

## 🏛️ Architecture & Visual Overview

<div align="center">

<img src="https://raw.githubusercontent.com/skeithnight/karsa-sentinel/main/assets/karsa-sentinel-visualize.png" alt="Karsa Sentinel Architecture & Execution Flow" width="100%" />

</div>

---

## ⚡ Quick Start

### 1. Initialize your project
```bash
npx karsa-sentinel init
```
*Scaffolds `playwright.config.ts` (with `defineBddConfig` & HTML reports), `src/pages/base.page.ts`, `src/fixtures/base.fixture.ts`, `.env.example`, and npm scripts.*

### 2. Create a requirement (`docs/login.md`)
```markdown
# Feature: User Authentication

## Target URL
https://www.saucedemo.com/

## Scenario: Successful Login
Given the user opens the login page
When the user enters username `standard_user`
And the user enters password `secret_sauce`
And the user clicks the Login button
Then the user is redirected to `/inventory.html`
And the page displays `Products`
```

### 3. Generate automation
```bash
npx karsa-sentinel generate ./docs/login.md
```

### 4. Run tests
```bash
npx karsa-sentinel run
```

---

## 🏗️ Enterprise Mode Architecture

By default, Karsa Sentinel generates a maintainable, modular BDD test suite:

```text
my-project/
├── features/
│   └── authentication.feature       # 🥒 Gherkin Feature Specifications
├── src/
│   ├── pages/
│   │   ├── base.page.ts             # 🏛️ Abstract BasePage (navigate, getErrorMessage, getTitleText)
│   │   └── authentication.page.ts   # 📦 Domain Page Objects with typed locators & action methods
│   ├── fixtures/
│   │   └── base.fixture.ts          # 💉 Typed Page Object Dependency Injection (test.extend)
│   └── steps/
│       └── authentication.steps.ts  # 🪜 Step Definitions consuming Action IR (createBdd)
└── playwright.config.ts             # ⚙️ defineBddConfig & Cucumber HTML Reporter
```

---

## 🧭 Scored Action Resolution & Strict Policy

Sentinel does not blindly convert AI output into selectors. Semantic actions are resolved against discovered live DOM evidence:

```text
Semantic Action: "Click Login button"
      ↓
Search Live UI Evidence (ApplicationMemory)
      ↓
Score Candidates (by Tag, Semantic Match, Attribute)
      ↓
Calculate Confidence Score (0.0 to 1.0)
      ↓
RESOLVED (Concrete Locator) / UNRESOLVED (Explicit Diagnostic Failure)
```

**Strict Resolution Policy**: Unresolved actions emit explicit diagnostics rather than silent waits, eliminating false-positive test passes.

---

## 🤖 Supported AI Providers

Configure your provider in `.env`:

### 9Router Proxy (Default)
```env
AI_PROVIDER=9router
NINE_ROUTER_BASE_URL=http://localhost:20218/v1
NINE_ROUTER_AUTH_TOKEN=sk-your-token
NINE_ROUTER_MODEL=mimo
```

### OpenAI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
AI_MODEL=gpt-4o
```

### Google Gemini
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
AI_MODEL=gemini-1.5-pro
```

### Mock (Offline Testing & CI/CD)
```env
AI_PROVIDER=mock
```

---

## 💻 CLI Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| `karsa-sentinel init` | Initialize a Sentinel automation workspace | `npx karsa-sentinel init` |
| `karsa-sentinel generate <doc>` | Generate Enterprise BDD suite from requirement | `npx karsa-sentinel generate ./docs/login.md` |
| `karsa-sentinel generate <doc> --mode=standalone` | Generate single flat `.spec.ts` script | `npx karsa-sentinel generate ./docs/login.md --mode=standalone` |
| `karsa-sentinel generate <doc> -d` | Generate with real-time DOM & AI debug tracing | `npx karsa-sentinel generate ./docs/login.md -d` |
| `karsa-sentinel run` | Execute test suite (auto-compiles BDD with `bddgen`) | `npx karsa-sentinel run` |
| `karsa-sentinel run --repair` | Execute test suite with autonomous live repair loop | `npx karsa-sentinel run --repair` |

---

## 🔌 Programmatic TypeScript API

```typescript
import { SentinelOrchestrator, NineRouterProvider, logger } from "karsa-sentinel";

// Optional: Enable debug mode
logger.setDebug(true);

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

## 📚 Full Documentation

For the complete architectural guide, autonomous self-healing details, and contributor resources:

👉 **[GitHub Repository: skeithnight/karsa-sentinel](https://github.com/skeithnight/karsa-sentinel)**

---

## 🎯 Vision

Karsa Sentinel is an open-source experiment toward a more reliable, evidence-grounded QA automation workflow:

```text
Product Intent
      ↓
AI Understanding
      ↓
Real Application Evidence
      ↓
Scored Automation Resolution
      ↓
Execution
      ↓
Live Browser Verification
```

**From Product Intent → Verified Automation.**

---

## 📄 License

[MIT](https://github.com/skeithnight/karsa-sentinel/blob/main/LICENSE) © [skeithnight](https://github.com/skeithnight)
