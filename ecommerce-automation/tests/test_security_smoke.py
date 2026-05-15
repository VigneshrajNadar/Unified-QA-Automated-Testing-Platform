import pytest
import requests
import json
import os
import time
from selenium.webdriver.common.by import By
from utils.result_logger import capture_screenshot

class TestSecuritySmoke:
    """
    Security Smoke Testing Tool.
    Performs non-destructive checks and exports results to JSON.
    """
    findings = []
    target_url_val = ""

    @classmethod
    def setup_class(cls):
        cls.findings = []

    @classmethod
    def teardown_class(cls):
        report_dir = os.path.join(os.getcwd(), 'reports')
        if not os.path.exists(report_dir):
            os.makedirs(report_dir)
            
        report_path = os.path.join(report_dir, 'security_findings.json')
        
        # Calculate summary
        high = len([f for f in cls.findings if f['severity'] == 'HIGH'])
        medium = len([f for f in cls.findings if f['severity'] == 'MEDIUM'])
        low = len([f for f in cls.findings if f['severity'] == 'LOW'])
        
        risk_rating = 'LOW'
        if high > 0: risk_rating = 'HIGH'
        elif medium > 0: risk_rating = 'MEDIUM'

        data = {
            "targetUrl": cls.target_url_val,
            "scanTime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": { "high": high, "medium": medium, "low": low },
            "riskRating": risk_rating,
            "findings": cls.findings
        }
        
        with open(report_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\n[Security] Findings saved to {report_path}")

    def test_header_security(self, target_url):
        TestSecuritySmoke.target_url_val = target_url # Capture URL
        print(f"\n[Security] Checking Headers for: {target_url}")
        
        try:
            response = requests.get(target_url, timeout=10)
            headers = response.headers
            
            required_headers = [
                ("X-Frame-Options", "MEDIUM", "Missing Anti-Clickjacking Header"),
                ("Content-Security-Policy", "MEDIUM", "Missing Content Security Policy"),
                ("X-Content-Type-Options", "LOW", "Missing MIME Type Protection"),
                ("Strict-Transport-Security", "MEDIUM", "Missing HSTS Header")
            ]
            
            for header, severity, desc in required_headers:
                if header not in headers:
                    TestSecuritySmoke.findings.append({
                        "title": f"Missing HTTP Header: {header}",
                        "severity": severity,
                        "description": desc,
                        "recommendation": f"Configure the server to send the {header} header."
                    })
                    print(f"[FAIL] Missing {header}")
                else:
                    print(f"[PASS] Found {header}")
                
        except Exception as e:
            print(f"[ERROR] Could not fetch headers: {e}")

    def test_cookie_security(self, driver, target_url):
        print(f"\n[Security] Checking Cookies...")
        driver.get(target_url)
        time.sleep(2)
        
        cookies = driver.get_cookies()
        if not cookies: return

        for cookie in cookies:
            name = cookie.get('name')
            if not cookie.get('secure'):
                TestSecuritySmoke.findings.append({
                    "title": f"Insecure Cookie: {name}",
                    "severity": "MEDIUM",
                    "description": f"The cookie '{name}' is missing the 'Secure' flag.",
                    "recommendation": "Set the 'Secure' flag to ensure the cookie is only sent over HTTPS."
                })
            
            if not cookie.get('httpOnly'):
                TestSecuritySmoke.findings.append({
                    "title": f"Cookie Missing HttpOnly: {name}",
                    "severity": "MEDIUM",
                    "description": f"The cookie '{name}' is missing the 'HttpOnly' flag, accessible to JS.",
                    "recommendation": "Set the 'HttpOnly' flag to prevent client-side script access."
                })

    def test_xss_injection(self, driver, target_url):
        print(f"\n[Security] Testing Input Fields for XSS...")
        driver.get(target_url)
        
        payload = "<script>console.log('XSS_TEST')</script>"
        inputs = driver.find_elements(By.TAG_NAME, "input")
        
        injected = False
        for i, field in enumerate(inputs):
            try:
                if field.is_displayed() and field.is_enabled():
                    field.clear()
                    field.send_keys(payload)
                    injected = True
            except: pass
        
        if injected:
            # Try submit
            try: field.submit() 
            except: pass
            time.sleep(2)
            
            if payload in driver.page_source:
                TestSecuritySmoke.findings.append({
                    "title": "Reflected XSS Vulnerability",
                    "severity": "HIGH",
                    "description": "User input was reflected back in the page source without encoding.",
                    "recommendation": "Sanitize all user inputs and use context-aware output encoding."
                })
                print(f"[CRITICAL] Reflected XSS Detected!")

    def test_auth_security(self, driver, target_url):
        print(f"\n[Security] Checking Authentication Security...")
        driver.get(target_url)
        
        if "https://" not in driver.current_url:
            TestSecuritySmoke.findings.append({
                "title": "Insecure Connection (HTTP)",
                "severity": "HIGH",
                "description": "The page is not served over HTTPS.",
                "recommendation": "Enforce HTTPS for all pages."
            })

