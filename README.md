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

## ✨ Core Modules & Features

### 1. 🤖 AI Test Generation (`/server/routes/aiTestGen.js`)
Leverages integrated AI models (like G4F and specialized Python generators) to dynamically create complex, syntactically correct test scripts based on natural language requirements. This drastically reduces the time spent on writing boilerplate test cases.

### 2. 🌐 Web & UI Automation (`/server/services/seleniumService.js`)
Execute robust end-to-end UI tests on remote or local browser instances. It supports uploading custom `.js` or `.py` scripts, parsing the results, and returning detailed logs and error traces.

### 3. 🔌 API Testing Hub (`/server/services/apiExecutor.js`)
Provides an interactive interface to build, validate, and execute HTTP requests. It supports advanced assertions, authentication injection (Bearer, Basic), parameterization, and direct Swagger/OpenAPI spec ingestion.

### 4. 👁️ Visual Regression Testing (`/server/routes/visualTesting.js`)
Automatically detects unintended UI changes. The system captures screenshots of the current web state and compares them against approved baselines using `pixelmatch`, highlighting visual discrepancies.

### 5. 🛡️ Security & SAST Testing (`/server/services/securityService.js`)
Integrated Static Application Security Testing (SAST) allowing developers to run security validations against target repositories or endpoints to identify vulnerabilities early in the CI/CD pipeline.

### 6. ⏱️ Performance & Uptime Monitoring (`/server/services/webMonitorService.js` & `monitorScheduler.js`)
A continuous background monitoring system that tracks website uptime, response times, and SSL certificate validity. It alerts the dashboard when a service degrades. Load testing is orchestrated via **k6**.

### 7. 🗂️ Test Management & Reporting (`/server/routes/testcases.js` & `reports.js`)
Manage comprehensive Test Cases, Projects, and Requirements. Map test runs to specific requirements to ensure full coverage. Export rich execution reports natively to **PDF** and **Excel**.

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

---

## 💡 Future Enhancements
*   [ ] Kubernetes & Docker Swarm orchestration templates for scaling Selenium Grid nodes.
*   [ ] Direct integration with Jira & Slack for real-time defect tracking and notifications.
*   [ ] Advanced AI self-healing mechanisms for brittle UI tests.

## 📄 License
This project is licensed under the ISC License.
