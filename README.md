# 🚀 Unified Automation Hub v2.0

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-ISC-green.svg" alt="License">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs" alt="Node">
  <img src="https://img.shields.io/badge/Selenium-WebDriver-43B02A.svg?logo=selenium" alt="Selenium">
  <img src="https://img.shields.io/badge/Playwright-Supported-2EAD33.svg?logo=playwright" alt="Playwright">
</p>

## 📌 Overview
The **Unified Automation Hub v2.0** is a comprehensive, full-stack orchestration dashboard designed to streamline, manage, and execute automated testing workflows. By integrating multiple industry-standard testing frameworks and advanced AI-driven capabilities, this platform empowers QA engineers, Developers, and Administrators to run robust UI, API, Visual Regression, Performance, and Security tests seamlessly from a centralized location.

---

## 👥 Role-Based Portals & Project Capabilities

Unified Automation Hub v2.0 provides isolated, highly specific toolsets based on three primary user roles: **Admin**, **Tester (QA Engineer)**, and **Developer**. Each role has access to specific project features and modules to maximize their efficiency.

### 👑 1. Administrator Role
The Admin portal is focused on high-level oversight, infrastructure monitoring, and user management. Admins are responsible for maintaining the health of the entire testing ecosystem.

*   **Project & User Management:** Complete oversight over all active testing projects. Admins can create new projects, assign team members (Testers/Developers) to specific projects, and manage Role-Based Access Control (RBAC).
*   **Web & Uptime Monitoring (`/monitor`):** Continuous background tracking of critical URLs. Uses `Node-Cron` to guarantee external dependencies are alive, responding with 2xx status codes, and maintaining valid SSL certificates.
*   **Performance & Load Testing (`/performance`):** Trigger distributed `k6` load testing campaigns. Admins simulate concurrent Virtual Users (VUs) to find server breaking points, measuring Requests Per Second (RPS) and latency percentiles.
*   **Security & SAST Testing (`/security`):** Execute high-level repository audits using `npm audit` and static code analyzers to ensure projects meet strict compliance standards and OWASP Top 10 guidelines before deployment.

### 🕵️ 2. QA Engineer / Tester Role
The Tester portal is the core functional area. It is entirely focused on creating, managing, and executing various automated tests and logging defects.

*   **Test Case & Requirements Management (`/test-cases`, `/requirements`):** Create structured manual and automated test cases. Map individual test cases directly to business requirements to ensure 100% Traceability Matrix coverage.
*   **Visual Regression Testing (VRT) (`/visual-testing`):** Capture pixel-perfect baseline screenshots of Web Components. Run automated daily comparison sweeps using `pixelmatch` to catch unintended layout, CSS, or responsive design regressions.
*   **API Testing Hub (`/api-testing`):** A fully-featured REST client. Import Swagger/OpenAPI specifications or manually craft GET/POST/PUT requests. Supports dynamic `{path}` parameter interpolation, Auth header injection, and JSON schema validation assertions.
*   **E-Commerce UI Automation (`/ecommerce`):** Run robust, end-to-end Selenium and Playwright scripts across multiple browsers. Verifies complex business workflows like adding items to a cart, checking out, and calculating dynamic pricing.
*   **Defect Management (`/defects`):** When tests fail, Testers can automatically or manually log defects with auto-generated reproduction steps, attached failure screenshots, and linked Jira-style priority workflows.

### 💻 3. Developer Role
The Developer portal is heavily integrated with the CI/CD pipeline. It empowers developers to run "shift-left" testing locally or via remote execution before pushing code.

*   **Automated CI/CD Pipeline Execution (`/autotest`):** Upload `.zip` archives or provide GitHub repository URLs to execute a massive, multi-phase automated pipeline. Runs Node/Python/Java pipelines including `npm install`, ESLint complexity analysis, Unit test coverage (`nyc`), and generates automated defect tickets.
*   **AI Test Script Generation (`/ai-testgen`):** Leverage advanced LLMs (via the `g4f` integration) to automatically scaffold boilerplate Selenium or Playwright code. Developers simply type "Test the login form" and receive syntactically valid `.js` or `.py` files to download and commit.
*   **Cloud Selenium Execution (`/selenium`):** Upload custom WebDriver scripts and execute them directly on the remote server's headless Chromium instance without needing to configure local WebDriver binaries.

---

## 🛠️ Tech Stack & Architecture

### **Frontend (Client)**
*   **React 19 & Vite:** A lightning-fast, modern UI foundation ensuring quick load times and high responsiveness.
*   **Framer Motion & GSAP:** Fluid, interactive animations and dynamic visualizations for a sleek user experience.
*   **Chart.js & Recharts:** Deep analytics and interactive test result dashboards to monitor pass/fail metrics.
*   **React Router:** Seamless single-page application (SPA) navigation across diverse testing modules.

### **Backend (Server)**
*   **Node.js & Express (v5):** High-performance backend orchestrating execution engines and REST APIs.
*   **MongoDB & SQLite3:** Hybrid database architecture supporting massive metrics scaling and reliable local persistence.
*   **JWT & bcrypt:** End-to-end secure Role-Based Access Control (RBAC).
*   **Multer:** Efficient handling of multipart file uploads for custom test scripts and `.zip` project files.
*   **PDFKit & ExcelJS:** Automated, rich reporting generation for sharing test executions with stakeholders.

### **Testing Engines & Integrations**
*   **Selenium WebDriver & Playwright:** Cross-browser UI automation executing complex workflows.
*   **Axios (Server-side):** Dynamic, robust API test execution parsing complex JSON schemas and Swagger docs.
*   **Pixelmatch & Sharp:** Deep Visual Regression Testing (VRT), creating baselines and computing pixel-perfect diffs.
*   **K6:** Integrated load testing to simulate high-traffic conditions.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (3.8+ with pip)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VigneshrajNadar/Unified-QA-Automated-Testing-Platform.git
   cd Unified-QA-Automated-Testing-Platform
   ```

2. **Initialize the Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Initialize the Frontend Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## 🔒 Security Posture & Hardening
*   **Strict RBAC:** API routes are protected by robust JWT middleware ensuring users can only access their authorized domains.
*   **Sanitization:** All database inputs are aggressively parameterized, nullifying injection risks.
*   **Rate Limiting & Helmet:** Prevents brute-force API attacks by strictly throttling requests and enforcing strong HTTP policies.
