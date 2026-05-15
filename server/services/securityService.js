const db = require('../database');
const axios = require('axios');

class SecurityService {

    // ==========================================
    // MAIN ENTRY POINTS
    // ==========================================

    async startSastScan(filename, codeContent) {
        const self = this;
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO security_scans (target, scan_type, status) VALUES (?, 'SAST', 'Running')`,
                [filename], function (err) {
                    if (err) return reject(err);
                    const scanId = this.lastID;
                    self._performSastAnalysis(scanId, codeContent);
                    resolve({ scanId, status: 'Running' });
                });
        });
    }

    async startDastScan(url) {
        const self = this;
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO security_scans (target, scan_type, status) VALUES (?, 'DAST', 'Running')`,
                [url], function (err) {
                    if (err) return reject(err);
                    const scanId = this.lastID;
                    self._performDastAnalysis(scanId, url);
                    resolve({ scanId, status: 'Running' });
                });
        });
    }

    async getScans() {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM security_scans ORDER BY scanned_at DESC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getScanDetails(scanId) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM security_scans WHERE scan_id = ?`, [scanId], (err, scan) => {
                if (err) return reject(err);
                if (!scan) return resolve(null);

                db.all(`SELECT * FROM security_findings WHERE scan_id = ?`, [scanId], (err, findings) => {
                    if (err) return reject(err);
                    scan.findings = findings;
                    resolve(scan);
                });
            });
        });
    }

    async deleteScan(scanId) {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM security_findings WHERE scan_id = ?`, [scanId], (err) => {
                if (err) return reject(err);
                db.run(`DELETE FROM security_scans WHERE scan_id = ?`, [scanId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    // ==========================================
    // SAST ENGINE (Static Analysis)
    // ==========================================

    _performSastAnalysis(scanId, code) {
        const findings = [];
        const lines = code.split('\n');

        const patterns = [
            // --- INJECTION ---
            { type: 'SQL Injection Risk', severity: 'Critical', regex: /(SELECT|INSERT|UPDATE|DELETE).*?\+.*?(req\.body|req\.query|req\.params)/i, remediation: 'Use parameterized queries (Prepared Statements).' },
            { type: 'OS Command Injection', severity: 'Critical', regex: /(exec|spawn|eval)\s*\(.*(req\.|cmd|input)/i, remediation: 'Avoid executing commands with user input.' },
            { type: 'NoSQL Injection', severity: 'High', regex: /\$where|\$ne|\$gt|\$lt/i, remediation: 'Sanitize inputs in NoSQL queries.' },
            { type: 'DOM XSS Risk', severity: 'High', regex: /innerHTML|outerHTML|document\.write\(/, remediation: 'Use textContent or safe frameworks/sanitizers.' },

            // --- AUTH & CRYPTO ---
            { type: 'Hardcoded Credential', severity: 'Critical', regex: /(password|secret|apikey|token|auth)\s*[:=]\s*['"][^'"]+['"]/i, remediation: 'Never hardcode secrets. Use environment variables.' },
            { type: 'Weak Password Limit', severity: 'Medium', regex: /password\.length\s*<\s*[0-7]/, remediation: 'Enforce strong passwords (min 8 chars).' },
            { type: 'Weak Hashing', severity: 'High', regex: /md5\s*\(|sha1\s*\(/i, remediation: 'Use bcrypt, Argon2, or SHA-256.' },
            { type: 'Insecure Random', severity: 'Medium', regex: /Math\.random\(\)/, remediation: 'Use crypto.getRandomValues() for security-critical randomness.' },

            // --- MISCONFIGURATION & VULNS ---
            { type: 'Prototype Pollution', severity: 'Critical', regex: /__proto__|constructor\.prototype/, remediation: 'Validate all inputs. Freeze prototypes if possible.' },
            { type: 'Potential SSRF', severity: 'Critical', regex: /axios\.get\s*\(\s*req\.|fetch\s*\(\s*req\./, remediation: 'Validate URL targets against an allowlist before making outbound requests.' },
            { type: 'Unsafe Regex (ReDoS)', severity: 'Medium', regex: /new\s+RegExp\s*\(.*req\./, remediation: 'Do not create RegExp objects from user input.' },
            { type: 'Deprecated Function', severity: 'Low', regex: /escape\s*\(|unescape\s*\(/, remediation: 'Use encodeURIComponent/decodeURIComponent instead.' },
            { type: 'Insecure Direct Object Ref', severity: 'Medium', regex: /req\.query\.id|req\.params\.user_id/, remediation: 'Validate user permissions before accessing resources by ID.' },
            { type: 'Console Log Leak', severity: 'Low', regex: /console\.log\s*\(.*(password|secret|token|key).*\)/i, remediation: 'Remove sensitive logging.' },
            { type: 'Insecure Cookie', severity: 'Medium', regex: /res\.cookie\s*\(.*(?!.*httpOnly)(?!.*secure)/, remediation: 'Always set httpOnly and secure flags for sensitive cookies.' }
        ];

        lines.forEach((line, index) => {
            patterns.forEach(pattern => {
                if (pattern.regex.test(line)) {
                    findings.push({
                        type: pattern.type,
                        severity: pattern.severity,
                        description: `[SAST] ${pattern.type} detected`,
                        location: `Line ${index + 1}: ${line.trim().substring(0, 80)}...`,
                        remediation: pattern.remediation
                    });
                }
            });
        });

        // JWT Token Check (Heuristic)
        if (/ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/.test(code)) {
            findings.push({
                type: 'Hardcoded JWT Token',
                severity: 'High',
                description: 'A dedicated JWT token string was found in the code.',
                location: 'Found likely JWT string',
                remediation: 'Revoke this token and use environment variables.'
            });
        }

        // Private IP Check (Code)
        if (/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)/.test(code)) {
            findings.push({
                type: 'Internal IP in Code',
                severity: 'Low',
                description: 'Hardcoded internal IP address found.',
                location: 'Found internal IP',
                remediation: 'Abstract config to environment variables.'
            });
        }

        this._saveResults(scanId, findings);
    }

    // ==========================================
    // DAST ENGINE (Dynamic Analysis)
    // ==========================================

    async _performDastAnalysis(scanId, url) {
        const findings = [];
        const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;

        try {
            // 1. Sensitive File Exposure
            const sensitiveFiles = ['.env', '.git/config', 'backup.sql', 'config.json', 'web.config', 'id_rsa', '.DS_Store'];
            for (const file of sensitiveFiles) {
                try {
                    const fileUrl = `${baseUrl}/${file}`;
                    const res = await axios.get(fileUrl, { validateStatus: () => true });
                    if (res.status === 200 && (
                        res.data.toString().includes('DB_PASSWORD') ||
                        res.data.toString().includes('repository=') ||
                        res.data.toString().includes('INSERT INTO') ||
                        res.headers['content-type'].includes('application/json')
                    )) {
                        findings.push({ type: 'Sensitive File Exposure', severity: 'Critical', description: `Exposed ${file} file accessible publicly.`, remediation: `Configure server to deny access to .${file} files.`, location: fileUrl });
                    }
                } catch (e) { /* Ignore */ }
            }

            // 2. Directory Traversal (LFI)
            try {
                const traversalUrl = `${baseUrl}/../../../../etc/passwd`;
                const res = await axios.get(traversalUrl, { validateStatus: () => true });
                if (res.status === 200 && (res.data.toString().includes('root:x:') || res.data.toString().includes('[extensions]'))) {
                    findings.push({ type: 'Directory Traversal', severity: 'Critical', description: 'Path traversal vulnerability detected (LFI).', remediation: 'Sanitize file path inputs and disable directory listing.', location: traversalUrl });
                }
            } catch (err) { /* Ignore */ }

            // 3. Admin Panel Enumeration
            const adminPaths = ['/admin', '/login', '/dashboard', '/wp-admin', '/administrator', '/cpanel'];
            for (const path of adminPaths) {
                try {
                    const adminUrl = `${baseUrl}${path}`;
                    const res = await axios.get(adminUrl, { validateStatus: () => true });
                    if (res.status === 200) {
                        findings.push({ type: 'Exposed Admin Panel', severity: 'Info', description: `Admin panel accessible at ${path}`, remediation: 'Restrict access to admin panels via IP allowlist or VPN.', location: adminUrl });
                    }
                } catch (err) { /* Ignore */ }
            }

            // 4. Security Headers & CORS & Cookies
            try {
                const res = await axios.get(url, { validateStatus: () => true });
                const headers = res.headers;

                if (!headers['content-security-policy']) findings.push({ type: 'Missing Header', severity: 'Medium', description: 'Content-Security-Policy header is missing', remediation: 'Configure CSP to prevent XSS.' });
                if (!headers['x-frame-options']) findings.push({ type: 'Missing Header', severity: 'Low', description: 'X-Frame-Options header is missing', remediation: 'Set X-Frame-Options to DENY or SAMEORIGIN.' });
                if (!headers['strict-transport-security']) findings.push({ type: 'Missing Header', severity: 'High', description: 'Strict-Transport-Security (HSTS) missing', remediation: 'Enforce HTTPS using HSTS.' });
                if (headers['server'] || headers['x-powered-by']) findings.push({ type: 'Info Leakage', severity: 'Low', description: 'Server/X-Powered-By header exposes backend technology.', remediation: 'Remove or obfuscate server banner headers.' });

                if (headers['access-control-allow-origin'] === '*') {
                    findings.push({ type: 'Insecure CORS', severity: 'Medium', description: 'Access-Control-Allow-Origin is set to wildcard (*)', remediation: 'Restrict CORS to trusted domains.', location: 'Header: Access-Control-Allow-Origin' });
                }

                const cookies = headers['set-cookie'];
                if (cookies) {
                    cookies.forEach(cookie => {
                        if (!cookie.includes('HttpOnly')) findings.push({ type: 'Insecure Cookie', severity: 'Low', description: 'Cookie missing HttpOnly flag', remediation: 'Set HttpOnly flag to prevent XSS theft.', location: `Cookie: ${cookie.substring(0, 20)}...` });
                        if (!cookie.includes('Secure') && url.startsWith('https')) findings.push({ type: 'Insecure Cookie', severity: 'Low', description: 'Cookie missing Secure flag (on HTTPS)', remediation: 'Set Secure flag to ensure cookie is only sent over HTTPS.', location: `Cookie: ${cookie.substring(0, 20)}...` });
                    });
                }

                const body = JSON.stringify(res.data);
                const emails = body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                if (emails && emails.length > 0) {
                    findings.push({ type: 'Privacy Leak', severity: 'Medium', description: `Found ${emails.length} email addresses in response body.`, remediation: 'Mask or remove PII from responses.', location: `Emails: ${emails.slice(0, 3).join(', ')}` });
                }
                const privateIps = body.match(/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)/g);
                if (privateIps && privateIps.length > 0) {
                    findings.push({ type: 'Internal IP Disclosure', severity: 'Low', description: 'Internal IP addresses revealed in response.', remediation: 'Hide internal infrastructure details.', location: `IPs: ${privateIps.slice(0, 3).join(', ')}` });
                }

            } catch (err) { /* Ignore */ }

            // 5. Mixed Content
            if (url.startsWith('https')) {
                try {
                    const res = await axios.get(url, { validateStatus: () => true });
                    if (res.data.toString().includes('http://')) {
                        findings.push({ type: 'Mixed Content', severity: 'Medium', description: 'HTTPS page contains insecure HTTP resources', remediation: 'Load all resources via HTTPS.', location: 'Found http:// links' });
                    }
                } catch (e) { }
            }

            // 6. SQL Injection Probe
            const sqliPayloads = ["' OR '1'='1", "' OR 1=1 --", '" OR ""="'];
            for (const payload of sqliPayloads) {
                try {
                    const testUrl = url.includes('?') ? `${url}&test=${encodeURIComponent(payload)}` : `${url}?test=${encodeURIComponent(payload)}`;
                    const res = await axios.get(testUrl);
                    if (res.data && (res.data.toString().includes('SQL syntax') || res.data.toString().includes('mysql_fetch'))) {
                        findings.push({ type: 'SQL Injection', severity: 'Critical', description: `Database error triggered by payload: ${payload}`, remediation: 'Sanitize all inputs and use prepared statements.', location: `Query Param` });
                        break;
                    }
                } catch (err) {
                    if (err.response && err.response.status === 500) {
                        findings.push({ type: 'Possible SQL Injection', severity: 'High', description: 'Server returned 500 Error on injection payload', remediation: 'Investigate error logs for DB queries.' });
                        break;
                    }
                }
            }

            // 7. XSS Probe (Reflected)
            const xssPayload = "<script>alert('VULN')</script>";
            try {
                const testUrl = url.includes('?') ? `${url}&q=${encodeURIComponent(xssPayload)}` : `${url}?q=${encodeURIComponent(xssPayload)}`;
                const res = await axios.get(testUrl);
                if (res.data && res.data.toString().includes(xssPayload)) {
                    findings.push({ type: 'Reflected XSS', severity: 'High', description: 'XSS payload returned unsanitized', remediation: 'Escape all user input before outputting to HTML.', location: 'Query Param: q' });
                }
            } catch (err) { /* Ignore */ }

        } catch (e) {
            console.error("DAST Critical Error", e);
        }

        this._saveResults(scanId, findings);
    }

    _saveResults(scanId, findings) {
        if (!scanId) return;
        let critical = 0, high = 0, medium = 0, low = 0;

        const stmt = db.prepare(`INSERT INTO security_findings (scan_id, vulnerability_type, severity, description, location, remediation) VALUES (?, ?, ?, ?, ?, ?)`);

        findings.forEach(f => {
            if (f.severity === 'Critical') critical++;
            else if (f.severity === 'High') high++;
            else if (f.severity === 'Medium') medium++;
            else low++;
            stmt.run([scanId, f.type, f.severity, f.description, f.location || 'Unknown', f.remediation]);
        });
        stmt.finalize();

        let score = (critical * 25) + (high * 15) + (medium * 5) + (low * 1);
        if (score > 100) score = 100;

        db.run(`UPDATE security_scans SET status = 'Completed', risk_score = ?, critical_count = ?, high_count = ?, medium_count = ?, low_count = ? WHERE scan_id = ?`,
            [score, critical, high, medium, low, scanId]);
    }
}

module.exports = new SecurityService();
