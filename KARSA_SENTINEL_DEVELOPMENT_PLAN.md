# Karsa Sentinel — Development Plan

> AI-powered QA automation agent that transforms product intent into validated Playwright BDD automation.

**Repository:** `karsa-sentinel`  
**Primary Language:** TypeScript  
**Automation:** Playwright  
**BDD:** Cucumber / Gherkin  
**Runtime:** Node.js  
**Status:** Development Blueprint

---

# 1. Product Vision

Karsa Sentinel is an AI Test Engineering Agent.

The user provides a lightweight document describing a feature, requirement, reproduction steps, expected behavior, and/or a URL.

Karsa Sentinel then:

```text
Document
   ↓
Understand
   ↓
Explore Application
   ↓
Design Tests
   ↓
Generate BDD
   ↓
Generate Playwright
   ↓
Execute
   ↓
Analyze
   ↓
Repair
   ↓
Verify
   ↓
Persist Knowledge
```

The target experience is:

```bash
npm run test:generate -- ./docs/login.md
```

The user should not need to manually create:

- test cases
- locators
- page objects
- step definitions
- Gherkin scenarios
- assertions
- test data wiring

The agent derives these artifacts from intent and application evidence.

---

# 2. Core Principle

## AI proposes. Sentinel verifies.

The LLM is not the source of truth.

AI can propose:

- requirements
- scenarios
- test cases
- locators
- assertions
- implementation
- repairs

Sentinel verifies those proposals through:

- structured schemas
- application inspection
- Playwright
- TypeScript compilation
- test execution
- screenshots
- traces
- runtime evidence

This prevents Karsa Sentinel from becoming an unreliable AI code generator.

---

# 3. Product Principles

## 3.1 Document Is Intent

Documents describe what the user wants to validate.

They do not need to contain implementation details.

Example:

```md
# Login

https://staging.myapp.com/login

Login with email and password.

Invalid password should show an error.
```

This is valid input.

---

## 3.2 Application Is Evidence

Karsa Sentinel must inspect the real application before generating UI automation.

It should not invent:

- button names
- input labels
- selectors
- navigation paths
- UI states

Example:

```text
Requirement:
"Click Login"

Observed application:

role: button
name: Login

Preferred locator:

getByRole('button', { name: 'Login' })
```

---

## 3.3 BDD Is the Behavioral Contract

Gherkin sits between test intent and implementation.

```text
Requirement
    ↓
Test Case
    ↓
BDD Scenario
    ↓
Step Definition
    ↓
Playwright
```

BDD should describe behavior, not implementation.

Bad:

```gherkin
When the user clicks CSS selector "#login"
```

Good:

```gherkin
When the user clicks the Login button
```

---

## 3.4 Generation Is Incremental

A new feature should not regenerate the entire test repository.

```text
Existing Automation
       +
New Requirement
       ↓
Impact Analysis
       ↓
Affected Tests Only
```

---

## 3.5 Execution Is Part of Generation

Generated code is not considered complete until it has been validated.

```text
Generate
   ↓
Compile
   ↓
Execute
   ↓
Analyze
   ↓
Repair if necessary
   ↓
Re-execute
```

---

# 4. Target User Experience

## 4.1 URL-only document

```md
# Login

https://staging.myapp.com/login
```

Command:

```bash
npm run test:generate -- ./docs/login.md
```

Expected behavior:

```text
Read document
    ↓
Detect URL
    ↓
Open browser
    ↓
Explore login page
    ↓
Discover UI
    ↓
Infer login behavior
    ↓
Generate scenarios
    ↓
Generate BDD
    ↓
Generate Playwright
    ↓
Run tests
    ↓
Repair failures
    ↓
Report result
```

---

## 4.2 Feature specification

```md
# Add Product to Cart

URL:
https://staging.shop.com/products/iphone-17

Steps:

1. Open the product page.
2. Select 256GB.
3. Select Black.
4. Click Add to Cart.
5. Open the cart.

Expected:

The product should appear in the cart
with the selected variant and quantity 1.
```

Command:

```bash
npm run test:generate -- ./docs/add-product-cart.md
```

---

# 5. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │    PRD / BRD / MD    │
                         │    Feature Document  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Document Ingestion   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Requirement Agent   │
                         │                     │
                         │ Intent              │
                         │ Rules               │
                         │ Acceptance Criteria │
                         │ URLs                │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   QA Orchestrator   │
                         └──────┬───────┬──────┘
                                │       │
                 ┌──────────────┘       └──────────────┐
                 ▼                                     ▼
        ┌─────────────────┐                   ┌─────────────────┐
        │ Web Explorer    │                   │ Test Designer   │
        │ Agent           │                   │ Agent           │
        │                 │                   │                 │
        │ Playwright      │                   │ Happy Path      │
        │ DOM             │                   │ Negative        │
        │ ARIA            │                   │ Validation      │
        │ Navigation      │                   │ Boundary        │
        │ Forms           │                   │ State           │
        └────────┬────────┘                   └────────┬────────┘
                 │                                     │
                 └────────────────┬────────────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │   Test Case Model   │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │    BDD Generator    │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ Automation Generator│
                       │                     │
                       │ Page Objects        │
                       │ Step Definitions    │
                       │ Fixtures            │
                       │ Test Data           │
                       └──────────┬──────────┘
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │  Execution Agent    │
                       │     Playwright      │
                       └──────────┬──────────┘
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                     PASS              FAIL
                         │                 │
                         │          ┌──────▼──────┐
                         │          │ Repair Agent│
                         │          └──────┬──────┘
                         │                 │
                         │          Re-execute
                         │                 │
                         └────────┬────────┘
                                  ▼
                           Verified Result
```

---

# 6. Agent Architecture

## 6.1 QA Orchestrator

The orchestrator owns the lifecycle.

Responsibilities:

- load document
- invoke requirement analysis
- coordinate browser exploration
- invoke test design
- generate BDD
- generate automation
- execute tests
- invoke repair
- persist state
- produce final report

Contract:

```typescript
interface QAOrchestrator {
  process(input: GenerationInput): Promise<GenerationResult>;
}
```

The orchestrator should contain workflow logic, not business-specific test logic.

---

# 7. Requirement Agent

## Responsibility

Convert unstructured documents into structured requirements.

Input:

```text
Markdown
PDF
DOCX
Text
URL
```

Output:

```typescript
interface Requirement {
  id: string;
  title: string;
  description: string;

  actor?: string;

  preconditions: string[];

  businessRules: string[];

  acceptanceCriteria: AcceptanceCriteria[];

  urls: string[];

  source: RequirementSource;

  confidence: number;
}
```

Source:

```typescript
interface RequirementSource {
  document: string;
  section?: string;
  page?: number;
  line?: number;
}
```

The agent must identify ambiguity.

Example:

```text
Requirement:
"User can checkout."

Missing:
- authentication state
- cart state
- payment method
- expected confirmation
```

The system should produce an ambiguity record rather than silently invent behavior.

---

# 8. Document Ingestion

Initial supported formats:

```text
.md
.txt
.pdf
.docx
```

Future:

```text
.html
.url
Confluence
Jira
Google Docs
GitHub
```

Architecture:

```text
Document
    ↓
Document Parser
    ↓
NormalizedDocument
    ↓
Requirement Agent
```

Contract:

```typescript
interface DocumentParser {
  supports(input: string): boolean;

  parse(input: string): Promise<NormalizedDocument>;
}
```

Normalized document:

```typescript
interface NormalizedDocument {
  id: string;
  title?: string;
  content: string;

  source: {
    path?: string;
    type: string;
  };

  urls: string[];
}
```

---

# 9. Web Explorer Agent

The Web Explorer Agent uses Playwright as the application's evidence collector.

Responsibilities:

- launch browser
- navigate URL
- inspect DOM
- inspect accessibility information
- discover interactive elements
- inspect forms
- inspect links
- inspect dialogs
- inspect navigation
- inspect visible states
- capture screenshots
- capture Playwright trace when required
- create UI evidence

Contract:

```typescript
interface WebExplorer {
  explore(
    url: string,
    context?: ExplorationContext
  ): Promise<UIEvidence>;
}
```

---

# 10. UI Evidence Model

The agent must maintain a structured representation of observed UI.

```typescript
interface UIElement {
  id: string;

  type: string;

  role?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  text?: string;

  visible: boolean;
  enabled?: boolean;

  locatorCandidates: LocatorCandidate[];

  pageUrl: string;
}
```

Locator:

```typescript
interface LocatorCandidate {
  strategy: LocatorStrategy;
  locator: string;
  confidence: number;
  evidence: string;
}
```

Strategies:

```typescript
type LocatorStrategy =
  | 'role'
  | 'label'
  | 'test-id'
  | 'placeholder'
  | 'text'
  | 'css'
  | 'xpath';
```

---

# 11. Locator Strategy

Recommended priority:

```text
1. getByRole()
2. getByLabel()
3. getByTestId()
4. getByPlaceholder()
5. getByText()
6. CSS
7. XPath
```

Example:

```typescript
page.getByRole('button', { name: 'Login' })
```

is preferred over:

```typescript
page.locator('body > div:nth-child(2) > button')
```

XPath should be a last resort.

The framework should retain alternative locator candidates to support self-repair.

---

# 12. Test Designer Agent

The Test Designer converts requirements into executable test intent.

Default dimensions:

```text
Happy Path
Negative
Validation
Boundary
Alternative Flow
Error Handling
State Transition
Authorization
Permission
```

Example:

```text
Requirement:
User can login with email and password.

Scenarios:

TC-LOGIN-001  Valid login
TC-LOGIN-002  Invalid password
TC-LOGIN-003  Invalid email
TC-LOGIN-004  Empty email
TC-LOGIN-005  Empty password
TC-LOGIN-006  Both fields empty
TC-LOGIN-007  Invalid email format
TC-LOGIN-008  Unregistered account
```

The agent should rank scenarios:

```text
Critical
High
Medium
Low
```

---

# 13. Test Case Model

The Test Case Model is the canonical contract between reasoning and generation.

```typescript
interface TestCase {
  id: string;

  requirementId: string;

  title: string;

  objective: string;

  priority:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low';

  category:
    | 'happy-path'
    | 'negative'
    | 'validation'
    | 'boundary'
    | 'error'
    | 'security'
    | 'authorization'
    | 'state';

  preconditions: string[];

  steps: TestStep[];

  expectedResults: string[];

  source: {
    document: string;
    requirementId: string;
  };
}
```

Step:

```typescript
interface TestStep {
  order: number;
  action: string;
  expected?: string;
}
```

---

# 14. BDD Generator

BDD is generated from structured test cases.

Example:

```gherkin
Feature: User Login

  @REQ-LOGIN-001
  @TC-LOGIN-001
  @critical
  Scenario: User successfully logs in with valid credentials

    Given the user is on the login page
    When the user enters a valid email
    And the user enters a valid password
    And the user clicks the Login button
    Then the user should be redirected to the dashboard
```

Rules:

- feature names describe business capability
- scenarios describe behavior
- steps remain implementation-independent
- requirement and test IDs are preserved as tags
- priority is represented as a tag
- generated BDD must be syntactically valid

---

# 15. Automation Generator

The Automation Generator transforms BDD into TypeScript Playwright implementation.

Responsibilities:

- generate page objects
- generate step definitions
- generate fixtures
- generate test data
- map semantic steps to UI evidence
- map assertions to observed application behavior

Example:

```typescript
export class LoginPage {
  constructor(private readonly page: Page) {}

  readonly emailInput =
    this.page.getByLabel('Email');

  readonly passwordInput =
    this.page.getByLabel('Password');

  readonly loginButton =
    this.page.getByRole('button', { name: 'Login' });

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

---

# 16. Generated Repository Structure

Generated automation should follow:

```text
tests/
├── features/
│   ├── auth/
│   │   └── login.feature
│   └── cart/
│       └── add-product.feature
│
├── steps/
│   ├── auth/
│   │   └── login.steps.ts
│   └── cart/
│       └── add-product.steps.ts
│
├── pages/
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── ProductPage.ts
│   └── CartPage.ts
│
├── fixtures/
│   └── test.fixture.ts
│
├── data/
│   └── users.ts
│
└── support/
    ├── hooks.ts
    ├── world.ts
    └── context.ts
```

---

# 17. Execution Agent

The Execution Agent runs generated automation.

Responsibilities:

- compile TypeScript
- run Cucumber/Playwright
- collect stdout/stderr
- collect screenshots
- collect traces
- collect failure metadata
- normalize execution results

Contract:

```typescript
interface TestExecutor {
  execute(
    tests: GeneratedTestSet
  ): Promise<ExecutionResult>;
}
```

---

# 18. Failure Model

Failures should be classified before repair.

```typescript
type FailureCategory =
  | 'locator'
  | 'timing'
  | 'navigation'
  | 'assertion'
  | 'authentication'
  | 'environment'
  | 'application'
  | 'test-data'
  | 'unknown';
```

Example:

```text
Error:
locator.getByRole('button', { name: 'Login' }) not found

Evidence:
Current DOM contains:

button:
  name = "Sign in"

Classification:
locator

Repair:
getByRole('button', { name: 'Sign in' })

Confidence:
0.94
```

---

# 19. Repair Agent

The Repair Agent receives:

```text
Test Failure
+
Original Requirement
+
BDD Scenario
+
Generated Code
+
UI Evidence
+
Current Application State
```

It produces:

```typescript
interface RepairPlan {
  failureCategory: FailureCategory;

  diagnosis: string;

  changes: RepairChange[];

  confidence: number;
}
```

Repair change:

```typescript
interface RepairChange {
  file: string;
  location: string;
  before: string;
  after: string;
  reason: string;
}
```

Rules:

1. Never modify code without diagnosing the failure.
2. Prefer observed UI evidence.
3. Prefer minimal changes.
4. Re-run after repair.
5. Persist only validated repairs.
6. Avoid infinite repair loops.

Recommended maximum:

```text
3 repair attempts per test
```

---

# 20. Memory Architecture

Karsa Sentinel maintains three primary memories.

```text
┌─────────────────────────────┐
│ Requirement Memory          │
│                             │
│ What should be tested?      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Application Memory          │
│                             │
│ What does the UI look like? │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Automation Memory            │
│                             │
│ What tests already exist?   │
└─────────────────────────────┘
```

---

# 21. Requirement Memory

Example:

```json
{
  "id": "REQ-LOGIN-001",
  "source": "docs/login.md",
  "feature": "login",
  "tests": [
    "TC-LOGIN-001",
    "TC-LOGIN-002",
    "TC-LOGIN-003"
  ]
}
```

---

# 22. Application Memory

Example:

```json
{
  "pages": {
    "/login": {
      "elements": {
        "email": {
          "role": "textbox",
          "label": "Email"
        },
        "password": {
          "role": "textbox",
          "label": "Password"
        },
        "login": {
          "role": "button",
          "name": "Login"
        }
      }
    }
  }
}
```

Application memory should be versioned because UI changes over time.

---

# 23. Automation Memory

Example:

```text
REQ-LOGIN-001
      ↓
TC-LOGIN-001
      ↓
login.feature
      ↓
login.steps.ts
      ↓
LoginPage.ts
      ↓
Execution Result
```

This enables traceability and impact analysis.

---

# 24. Traceability Graph

The system should eventually maintain:

```text
Requirement
     │
     ▼
Test Case
     │
     ▼
BDD Scenario
     │
     ▼
Step Definition
     │
     ▼
Page Object
     │
     ▼
UI Element
     │
     ▼
Playwright Action
     │
     ▼
Execution
     │
     ▼
Result
```

This graph is one of the core differentiators of Karsa Sentinel.

---

# 25. Incremental Generation

When a new document is added:

```text
docs/
├── login.md
├── checkout.md
└── add-coupon.md
```

The framework should detect:

```text
login.md
→ Existing

checkout.md
→ Existing

add-coupon.md
→ New
```

Only the new requirement is processed.

When an existing document changes:

```text
login.md
```

the framework performs impact analysis.

Example:

```text
REQ-LOGIN-001 changed

Affected:
├── TC-LOGIN-001
├── TC-LOGIN-002
├── login.feature
├── login.steps.ts
└── LoginPage.ts
```

---

# 26. AI Provider Abstraction

The framework must be independent of a single AI vendor.

```typescript
interface AIProvider {
  extractRequirements(
    document: NormalizedDocument
  ): Promise<Requirement[]>;

  generateTestCases(
    requirement: Requirement
  ): Promise<TestCase[]>;

  generateBDD(
    testCase: TestCase
  ): Promise<BDDScenario>;

  analyzeFailure(
    failure: TestFailure
  ): Promise<RepairPlan>;
}
```

Potential providers:

```text
OpenAI
Gemini
Claude
9Router
Local LLM
```

Provider-specific code must stay behind the provider interface.

---

# 27. Structured AI Output

AI responses must not be consumed as arbitrary text.

All important outputs must be structured and validated.

Pipeline:

```text
LLM
 ↓
JSON / Structured Output
 ↓
Schema Validation
 ↓
Domain Model
 ↓
Business Validation
 ↓
Next Agent
```

Use schema validation for:

- Requirement
- TestCase
- BDDScenario
- UIElement
- RepairPlan
- ExecutionResult

---

# 28. CLI Design

Initial commands:

```bash
npm run test:init
```

```bash
npm run test:generate -- ./docs/login.md
```

```bash
npm run test:crawl -- https://staging.myapp.com
```

```bash
npm run test:run
```

```bash
npm run test:repair
```

The primary workflow is:

```bash
npm run test:generate -- ./docs/new-feature.md
```

This command should run the complete agent lifecycle.

---

# 29. CLI Output

Example:

```text
╭────────────────────────────────────────╮
│          KARSA SENTINEL                │
│          AI QA AUTOMATION AGENT        │
╰────────────────────────────────────────╯

Document
  ✓ add-product-cart.md

Requirement
  ✓ Feature identified: Add Product to Cart

Application
  ✓ https://staging.shop.com

Exploration
  ✓ Product page
  ✓ Variant selector
  ✓ Add to Cart
  ✓ Cart page

Test Design
  ✓ 8 scenarios generated

BDD
  ✓ add-product.feature

Automation
  ✓ ProductPage.ts
  ✓ CartPage.ts
  ✓ add-product.steps.ts

Execution
  ✓ 7 passed
  ✗ 1 failed

AI Repair
  ✓ Locator mismatch detected
  ✓ Locator repaired

Re-execution
  ✓ 8 passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: 8 / 8 PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# 30. Repository Architecture

Initial repository:

```text
karsa-sentinel/
│
├── src/
│   ├── agents/
│   │   ├── orchestrator/
│   │   ├── requirement/
│   │   ├── explorer/
│   │   ├── test-designer/
│   │   ├── bdd-generator/
│   │   ├── automation/
│   │   ├── execution/
│   │   └── repair/
│   │
│   ├── core/
│   │   ├── models/
│   │   ├── contracts/
│   │   ├── schemas/
│   │   └── pipeline/
│   │
│   ├── crawler/
│   │   ├── browser/
│   │   ├── discovery/
│   │   ├── accessibility/
│   │   └── locators/
│   │
│   ├── documents/
│   │   ├── pdf/
│   │   ├── docx/
│   │   ├── markdown/
│   │   └── parser/
│   │
│   ├── generators/
│   │   ├── bdd/
│   │   ├── playwright/
│   │   └── project/
│   │
│   ├── execution/
│   │   ├── runner/
│   │   ├── reporter/
│   │   └── failure-analysis/
│   │
│   ├── memory/
│   │   ├── requirements/
│   │   ├── application/
│   │   └── automation/
│   │
│   ├── providers/
│   │   ├── openai/
│   │   ├── gemini/
│   │   └── router/
│   │
│   └── cli/
│
├── docs/
│   └── examples/
│
├── generated/
│
├── tests/
│
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

---

# 31. Initial Dependencies

Expected foundation:

```text
TypeScript
Node.js
Playwright
@cucumber/cucumber
Zod
Commander or similar CLI framework
```

AI SDKs should be isolated behind provider adapters.

Avoid adding unnecessary dependencies during the MVP.

---

# 32. Environment Configuration

Example:

```env
AI_PROVIDER=openai
AI_MODEL=<model>

BASE_URL=https://staging.example.com

PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

MAX_REPAIR_ATTEMPTS=3
```

Secrets must never be committed.

---

# 33. Security Rules

Karsa Sentinel will eventually interact with real applications.

The framework must:

- never commit credentials
- support environment variables
- avoid logging secrets
- redact sensitive values
- avoid sending unnecessary page content to external LLMs
- support configurable data masking
- restrict crawler domains
- prevent unintended external navigation
- provide explicit execution targets

For authenticated applications, credentials should be provided through environment/secret configuration.

---

# 34. Crawling Safety

The crawler must have boundaries.

Initial controls:

```typescript
interface CrawlPolicy {
  allowedDomains: string[];
  maxPages: number;
  maxDepth: number;
  timeoutMs: number;

  allowExternalLinks: boolean;

  allowedMethods: string[];
}
```

Default behavior:

```text
Same domain only
Limited page count
Limited depth
No destructive actions unless explicitly enabled
```

---

# 35. Quality Gates

Every generation should pass:

```text
Document Validation
        ↓
Requirement Schema Validation
        ↓
Test Case Validation
        ↓
BDD Validation
        ↓
TypeScript Compilation
        ↓
Playwright Execution
        ↓
Failure Classification
        ↓
Repair Validation
```

Generated artifacts are not considered valid merely because the LLM produced them.

---

# 36. Testing Strategy

Karsa Sentinel itself must be tested at multiple levels.

## Unit Tests

Test:

- document parsers
- domain models
- schema validation
- locator ranking
- requirement normalization
- test design rules
- impact analysis

---

## Integration Tests

Test:

```text
Document
   ↓
Requirement Agent
   ↓
Test Designer
   ↓
BDD Generator
```

and:

```text
BDD
   ↓
Automation Generator
   ↓
TypeScript
```

---

## Browser Tests

Use controlled fixture applications.

Example:

```text
fixtures/
├── login-app/
├── checkout-app/
└── ecommerce-app/
```

These applications should intentionally contain predictable UI structures and failures.

---

## End-to-End Tests

Validate the complete workflow:

```text
Document
   ↓
AI
   ↓
Crawler
   ↓
Test Generation
   ↓
Execution
   ↓
Repair
```

---

# 37. MVP Scope

The first MVP should be intentionally narrow.

## MVP Goal

Support:

```text
Markdown Document
+
URL
+
AI Provider
+
Playwright
+
BDD
```

Workflow:

```text
.md
 ↓
Requirement
 ↓
Crawl
 ↓
Test Cases
 ↓
.feature
 ↓
.ts
 ↓
Execute
```

MVP should support:

- Markdown
- one application URL
- one AI provider
- Playwright
- Gherkin
- Page Objects
- basic execution
- basic failure classification
- locator repair
- JSON memory

Do not build integrations yet.

---

# 38. Phase Roadmap

## Phase 1 — Foundation

Goal:

```text
Document → Requirement → Test Case
```

Tasks:

- [ ] Initialize TypeScript project
- [ ] Create CLI
- [ ] Implement Markdown parser
- [ ] Create domain models
- [ ] Create Zod schemas
- [ ] Create AI provider interface
- [ ] Implement first AI provider
- [ ] Persist requirement/test-case state
- [ ] Add unit tests

Definition of Done:

```text
npm run test:generate -- ./docs/login.md
```

can extract requirements and produce structured test cases.

---

## Phase 2 — Web Exploration

Goal:

```text
URL → UI Evidence
```

Tasks:

- [ ] Integrate Playwright
- [ ] Implement browser manager
- [ ] Implement page explorer
- [ ] Discover buttons
- [ ] Discover inputs
- [ ] Discover links
- [ ] Discover forms
- [ ] Inspect accessibility roles
- [ ] Generate locator candidates
- [ ] Persist application memory
- [ ] Add crawl limits

Definition of Done:

A URL can be explored and represented as structured UI evidence.

---

## Phase 3 — BDD

Goal:

```text
Test Case → .feature
```

Tasks:

- [ ] Implement BDD model
- [ ] Generate feature files
- [ ] Generate scenarios
- [ ] Generate Given/When/Then
- [ ] Add requirement tags
- [ ] Add test-case tags
- [ ] Add priority tags
- [ ] Validate Gherkin

Definition of Done:

Structured test cases produce valid, readable Gherkin.

---

## Phase 4 — Playwright Automation

Goal:

```text
BDD → Playwright TypeScript
```

Tasks:

- [ ] Generate Page Objects
- [ ] Generate step definitions
- [ ] Generate fixtures
- [ ] Generate test data
- [ ] Map BDD steps to UI evidence
- [ ] Generate assertions
- [ ] Compile generated project

Definition of Done:

Generated automation compiles and can execute against the target application.

---

## Phase 5 — Autonomous Execution

Goal:

```text
Generate → Execute → Analyze
```

Tasks:

- [ ] Execution engine
- [ ] Result parser
- [ ] Screenshot capture
- [ ] Trace capture
- [ ] Failure normalization
- [ ] Failure classification
- [ ] CLI reporting

Definition of Done:

The generator automatically executes generated tests and reports structured results.

---

## Phase 6 — Self Repair

Goal:

```text
FAIL → Diagnose → Repair → PASS
```

Tasks:

- [ ] Repair Agent
- [ ] Locator repair
- [ ] Assertion repair
- [ ] Navigation repair
- [ ] Repair confidence
- [ ] Repair diff
- [ ] Repair validation
- [ ] Repair attempt limit

Definition of Done:

At least one controlled locator failure can be automatically repaired and validated.

---

## Phase 7 — Incremental Intelligence

Goal:

```text
New / Changed Requirement
          ↓
Impact Analysis
          ↓
Affected Automation Only
```

Tasks:

- [ ] Requirement fingerprinting
- [ ] Document change detection
- [ ] Traceability graph
- [ ] Automation mapping
- [ ] Impact analysis
- [ ] Incremental generation
- [ ] Application memory versioning

Definition of Done:

A changed requirement does not trigger unnecessary regeneration.

---

# 39. Future Roadmap

Potential capabilities:

```text
PRD ingestion
BRD ingestion
Jira integration
GitHub integration
GitLab integration
Confluence integration
Slack integration
Microsoft Teams integration
Test management integration
CI/CD integration
MCP support
Visual validation
API test generation
Mobile automation
Performance test generation
Security test suggestions
Accessibility test generation
```

---

# 40. Future Agent Ecosystem

Eventually:

```text
                    Karsa Sentinel
                          │
             ┌────────────┼────────────┐
             │            │            │
      Requirement      Explorer     Test Design
         Agent           Agent         Agent
             │            │            │
             └────────────┼────────────┘
                          │
                    Automation
                       Agent
                          │
                    Execution
                       Agent
                          │
                    Analysis
                       Agent
                          │
                     Repair
                       Agent
                          │
                     Learning
                       Agent
```

---

# 41. Observability

Every generation should produce an execution record.

Example:

```json
{
  "runId": "run-2026-001",
  "document": "docs/login.md",
  "requirements": 1,
  "testCases": 8,
  "scenarios": 8,
  "generatedFiles": 5,
  "execution": {
    "passed": 8,
    "failed": 0,
    "repaired": 1
  }
}
```

The system should eventually expose:

- generation duration
- AI latency
- AI token usage
- exploration duration
- number of pages explored
- number of UI elements discovered
- generated scenarios
- execution duration
- repair attempts
- repair success rate

---

# 42. Cost Control

AI usage must be observable.

Avoid sending entire application DOM or entire repositories to the LLM repeatedly.

Use:

```text
Targeted Evidence
+
Relevant Requirement
+
Relevant Existing Automation
```

instead of:

```text
Entire Repository
+
Entire DOM
+
Entire Document
```

Application memory should reduce repeated exploration.

---

# 43. Failure Modes to Design For

Karsa Sentinel should explicitly handle:

```text
URL unavailable
Authentication required
Dynamic UI
SPA navigation
Missing elements
Ambiguous requirement
Contradictory requirement
Insufficient test data
Application error
LLM hallucination
Invalid structured output
Generated code compilation failure
Locator failure
Assertion failure
Environment failure
```

The system should fail transparently.

Never claim a test is generated or validated if execution did not actually confirm it.

---

# 44. Definition of Done — MVP

The MVP is complete when:

- [ ] User can initialize a project.
- [ ] User can provide a Markdown document.
- [ ] Document can contain only a URL.
- [ ] AI can identify the feature.
- [ ] Playwright can explore the target application.
- [ ] UI elements can be represented as evidence.
- [ ] AI can generate multiple test scenarios.
- [ ] Test scenarios map to requirements.
- [ ] Valid Gherkin can be generated.
- [ ] Playwright TypeScript can be generated.
- [ ] Generated automation can compile.
- [ ] Generated automation can execute.
- [ ] Failures can be classified.
- [ ] At least basic locator repair works.
- [ ] Results are persisted.
- [ ] Existing tests are not blindly overwritten.
- [ ] CLI provides a clear execution summary.

---

# 45. Non-Goals for MVP

Do not initially build:

- Jira integration
- Slack integration
- multi-tenant SaaS
- web dashboard
- distributed execution
- complex vector database
- autonomous production crawling
- mobile automation
- API automation
- performance testing
- security scanning

The first milestone is:

> **Document → AI → Browser → BDD → Playwright → Execute**

Everything else comes after this loop is reliable.

---

# 46. Core Differentiator

Karsa Sentinel should not be positioned as:

> "AI that writes Playwright tests."

That is too narrow.

The stronger positioning is:

> **Karsa Sentinel understands product intent, observes the real application, designs tests, generates automation, executes it, and validates the result.**

The fundamental loop is:

```text
INTENT
  ↓
EVIDENCE
  ↓
REASONING
  ↓
AUTOMATION
  ↓
EXECUTION
  ↓
FEEDBACK
  ↓
REPAIR
  ↓
VERIFICATION
```

---

# 47. Final Product Definition

**Karsa Sentinel** is an AI Test Engineering Agent that transforms product requirements and lightweight feature documentation into validated Playwright BDD automation.

Its core promise:

```text
You describe what should happen.

Karsa Sentinel discovers how the application works,
designs what should be tested,
builds the automation,
runs it,
and fixes what it can prove is broken.
```

Final target command:

```bash
npm run test:generate -- ./docs/new-feature.md
```

Expected lifecycle:

```text
READ
 ↓
UNDERSTAND
 ↓
EXPLORE
 ↓
DESIGN
 ↓
GENERATE
 ↓
EXECUTE
 ↓
ANALYZE
 ↓
REPAIR
 ↓
VERIFY
 ↓
REMEMBER
```

**Karsa Sentinel**

> **From Product Intent to Verified Automation.**
