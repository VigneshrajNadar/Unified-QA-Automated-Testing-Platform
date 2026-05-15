# 🚀 Unified QA & Automated Testing Platform

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-ISC-green.svg" alt="License">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs" alt="Node">
  <img src="https://img.shields.io/badge/Selenium-WebDriver-43B02A.svg?logo=selenium" alt="Selenium">
  <img src="https://img.shields.io/badge/Playwright-Supported-2EAD33.svg?logo=playwright" alt="Playwright">
</p>

## 📌 Overview
The **Unified QA & Automated Testing Platform** is a comprehensive, full-stack orchestration dashboard designed to streamline, manage, and execute automated testing workflows. By integrating multiple industry-standard testing frameworks and advanced AI-driven capabilities, this platform empowers QA engineers and developers to run robust UI, API, Visual Regression, Performance, and Security tests seamlessly from a centralized location.

---

## 🛠️ Tech Stack & Architecture

### **Frontend (Client)**
*   **React 19 & Vite:** A lightning-fast, modern UI foundation ensuring quick load times and high responsiveness.
*   **Framer Motion & GSAP:** Fluid, interactive animations and dynamic visualizations for a sleek user experience.
*   **Chart.js & Recharts:** Deep analytics and interactive test result dashboards to monitor pass/fail metrics.
*   **React Router:** Seamless single-page application (SPA) navigation across diverse testing modules.
*   **Lucide React & React Icons:** Clean and modern iconography.
*   **Axios:** Configured with robust interceptors to securely handle authenticated backend requests.

### **Backend (Server)**
*   **Node.js & Express (v5):** High-performance backend orchestrating execution engines and REST APIs.
*   **SQLite3:** Lightweight, embedded database for reliable test data persistence (results, test cases, and configurations).
*   **JWT & bcrypt:** End-to-end secure Role-Based Access Control (RBAC) and authentication, eliminating unauthorized access.
*   **Helmet & Express Rate Limit:** Hardened security middleware protecting against DDoS, XSS, and injection attacks.
*   **Multer:** Efficient handling of multipart file uploads for custom test scripts and test data files.
*   **PDFKit & ExcelJS:** Automated, rich reporting generation for sharing test executions with stakeholders.
*   **Node-Cron:** Task scheduling for automated background test runs and continuous monitoring.

### **Testing Engines & Integrations**
*   **Selenium WebDriver:** Cross-browser UI automation executing complex workflows using Javascript/Python bindings.
*   **Playwright:** Lightning-fast, next-generation end-to-end testing with built-in auto-waiting.
*   **Axios (Server-side):** Dynamic, robust API test execution parsing complex JSON schemas and Swagger docs.
*   **Pixelmatch & Sharp:** Deep Visual Regression Testing (VRT), creating baselines and computing pixel-perfect diffs.
*   **K6:** Integrated load testing to simulate high-traffic conditions and measure application performance.
*   **Python Scripts:** Supplemental automation workflows (e.g., specific ecommerce platform verifications) handled via Python `cross-spawn`.

---

## ✨ Core Modules, Tools, & Expected Outputs

### 1. 🤖 AI Test Generation Module (`/server/routes/aiTestGen.js`)
*   **What it does:** Uses integrated Large Language Models (LLMs) via the `g4f` Python wrapper to automatically generate complete, syntactically valid Javascript/Python automation scripts based on plain English user prompts (e.g., "Write a test to login and add an item to the cart").
*   **Expected Output:** Returns a fully formed, executable `.js` (Selenium/Playwright) or `.py` code block that users can directly save or execute within the platform.

### 2. 🌐 Web & UI Automation Service (`/server/services/seleniumService.js` & `playwrightRunner.js`)
*   **What it does:** Orchestrates browser-based End-to-End (E2E) testing. Users upload scripts or write them in the dashboard. The backend utilizes `selenium-webdriver` or `playwright` to spawn a headless/headed browser, execute the actions (clicks, inputs, assertions), and capture telemetry.
*   **Expected Output:** A structured JSON response detailing the `status` (Pass/Fail), execution `duration`, full `console logs`, `stack traces` (if failed), and optionally base64 encoded `screenshots` of the final state or failure point.

### 3. 🔌 API Testing Hub (`/server/services/apiExecutor.js`)
*   **What it does:** Bypasses UI to directly interact with REST APIs. It parses user-defined requests (GET, POST, PUT, DELETE), handles header injection (Authorization, Content-Type), and allows users to define expected assertion parameters (Expected Status Code, Expected Body patterns). It can also parse `Swagger/OpenAPI` definitions to auto-populate endpoints.
*   **Expected Output:** Displays the raw HTTP `Status Code` (e.g., 200 OK), Response `Headers`, parsed `JSON Body`, and an `Assertion Report` indicating whether the actual response matched the expected criteria.

### 4. 👁️ Visual Regression Testing (VRT) (`/server/routes/visualTesting.js` & `imageComparer.js`)
*   **What it does:** Identifies unintended layout or styling changes. It captures a baseline screenshot of a web component. During subsequent runs, it captures a new screenshot and uses `pixelmatch` to do a pixel-by-pixel comparison against the baseline.
*   **Expected Output:** Returns a composite difference image (highlighting changed pixels in bright red), a `mismatch percentage` (e.g., 2.45%), and a binary `Pass/Fail` flag based on a user-defined threshold tolerance.

### 5. 🛡️ Security & SAST Testing (`/server/services/securityService.js`)
*   **What it does:** Performs Static Application Security Testing (SAST) on provided repositories or source files. It scans for hardcoded secrets, misconfigured headers, SQL injection vulnerabilities, and known CVEs in dependencies.
*   **Expected Output:** A comprehensive security audit report detailing `Vulnerability Type`, `Severity Level` (Critical, High, Medium, Low), `File/Line Number`, and `Remediation Recommendations`.

### 6. ⏱️ Performance & Uptime Monitoring (`/server/services/webMonitorService.js`, `monitorScheduler.js`, & `k6Runner.js`)
*   **What it does:** 
    *   **Uptime:** Uses `Node-Cron` to ping predefined URLs at set intervals to ensure they are returning 2xx status codes and valid SSL certificates.
    *   **Load Testing:** Triggers `k6` scripts to simulate concurrent Virtual Users (VUs) hitting an endpoint to test server scalability under stress.
*   **Expected Output:** Real-time dashboard charts showing `Response Times (ms)`, `Uptime Percentage`, `SSL Expiry Days`, and for load tests, `Requests Per Second (RPS)` and `P95/P99 Latency`.

### 7. 🗂️ Test Management, Reporting, & Exporting (`/server/routes/testcases.js`, `reports.js`, `pdfGenerator.js`)
*   **What it does:** Acts as a centralized Test Case Management System (TCMS). Users can group tests into Projects, map them to Requirements, and track historical pass/fail rates. The export module uses `PDFKit` and `ExcelJS` to compile this data.
*   **Expected Output:** Downloadable, highly formatted `.pdf` or `.xlsx` files containing executive summaries, pie charts of test statuses, and detailed tabular data of every executed test run for stakeholder review.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (3.8+ with pip)
*   **(Optional)** Chrome/Firefox WebDriver for local Selenium execution.

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
   *The server runs on `http://localhost:5000`.*

3. **Initialize the Frontend Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   *The client runs on `http://localhost:5173`.*

4. **Initialize Python Dependencies (For Advanced Scripting):**
   ```bash
   cd ../ecommerce-automation
   python migrate_requirements.py
   # or
   pip install -r requirements.txt
   ```

---

## 🔒 Security Posture & Hardening
*   **Strict RBAC:** API routes are protected by robust JWT middleware ensuring users can only access their authorized domains.
*   **Sanitization:** All database inputs are aggressively parameterized, nullifying SQL injection risks.
*   **Rate Limiting:** Prevents brute-force API attacks by strictly throttling requests.
*   **Secure Headers:** `Helmet` obscures stack traces and enforces strong HTTP policies.
