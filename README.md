# 🚀 Unified QA & Automated Testing Platform

## 📌 Overview
The **Unified QA & Automated Testing Platform** is a comprehensive, full-stack orchestration tool designed to streamline, manage, and execute automated testing workflows. By integrating cutting-edge testing frameworks and AI-driven capabilities, this platform empowers QA engineers and developers to run robust UI, API, and visual regression tests seamlessly.

## 🛠️ Tech Stack & Tools Included

### **Frontend (Client)**
*   **React 19 & Vite:** Lightning-fast, modern UI foundation.
*   **Framer Motion & GSAP:** Fluid, interactive animations and dynamic visualizations.
*   **Chart.js & Recharts:** Deep analytics and interactive test result dashboards.
*   **React Router:** Seamless navigation between testing modules.
*   **Lucide & React Icons:** Clean and modern iconography.
*   **Axios:** Frontend HTTP client for API interactions.

### **Backend (Server)**
*   **Node.js & Express (v5):** High-performance backend API orchestration.
*   **SQLite3:** Lightweight, embedded database for robust test data persistence.
*   **JWT (JSON Web Tokens) & bcrypt:** Secure Role-Based Access Control (RBAC) and authentication.
*   **Helmet & Express Rate Limit:** Hardened security middleware against DDoS and injection attacks.
*   **Multer:** Efficient handling of file uploads (e.g., test scripts, data files).
*   **PDFKit:** Automated, rich PDF report generation for test executions.
*   **Node-Cron:** Task scheduling for automated background test runs.

### **Testing Engines & Frameworks**
*   **Selenium WebDriver:** Cross-browser, industry-standard UI automation.
*   **Playwright:** Next-generation, lightning-fast end-to-end testing.
*   **Axios:** Dynamic API test execution and validation (Server-side).
*   **Pixelmatch & Sharp:** Advanced Visual Regression Testing (VRT) and image comparison.
*   **NYC:** Code coverage analysis.
*   **Python (ecommerce-automation):** Supplemental scripts for advanced automation workflows and driver setups.

## ✨ Key Features
*   **Centralized Dashboard:** Monitor test executions, success rates, and historical analytics in real-time.
*   **Multi-Engine Execution:** Choose between Selenium or Playwright based on your specific UI testing requirements.
*   **Intelligent API Testing:** Define, run, and validate API endpoints directly from the platform.
*   **Visual Regression Validation:** Automatically detect unintended UI changes down to the pixel level.
*   **AI Test Generation:** Leverage AI to dynamically generate test cases and scripts.
*   **Secure & Scalable:** Fully authenticated architecture with hardened security practices ensuring enterprise readiness.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.8+)
*   Docker (Optional, for containerized deployments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VigneshrajNadar/Unified-QA-Automated-Testing-Platform.git
   cd Unified-QA-Automated-Testing-Platform
   ```

2. **Setup the Backend Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Setup the Frontend Client**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Initialize Python Automation Scripts** (Optional)
   ```bash
   cd ecommerce-automation
   python migrate_requirements.py
   ```

## 🔒 Security Best Practices Implemented
*   Strict Role-Based Access Control (RBAC).
*   Centralized authenticated service layers to prevent 401/Unauthorized errors.
*   Protection against SQL Injection via parameterized queries.
*   Rate limiting and security headers (Helmet).
