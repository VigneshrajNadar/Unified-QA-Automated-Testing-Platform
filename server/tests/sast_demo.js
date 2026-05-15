// ==========================================
// VULNERABLE CODE DEMO (DO NOT USE IN PRODUCTION)
// ==========================================

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');

// 1. HARDCODED SECRETS
const AWS_KEY = "AKIA1234567890123456"; // Vulnerable
const DB_PASSWORD = "super_secret_password_123"; // Vulnerable
const JWT_SECRET = "eyJhGcioJ123.eyJzdWIi.SflKxwRJSMeKKF2QT4fwpMeJf36POk6y"; // Hardcoded JWT

// 2. SQL INJECTION (Classic)
app.get('/users', (req, res) => {
    const query = "SELECT * FROM users WHERE name = '" + req.query.name + "'"; // Vulnerable
    db.execute(query);
});

// 3. NOSQL INJECTION
app.post('/login', (req, res) => {
    // Vulnerable to { $gt: "" }
    db.collection('users').find({
        username: req.body.username,
        password: req.body.password
    });
});

// 4. OS COMMAND INJECTION
app.get('/ping', (req, res) => {
    // Vulnerable: user can pass "; rm -rf /"
    require('child_process').exec("ping -c 1 " + req.query.ip);
});

// 5. SSRF (Server Side Request Forgery)
app.get('/proxy', async (req, res) => {
    // Vulnerable: attacker can access internal metadata IPs
    const response = await axios.get(req.query.url);
    res.send(response.data);
});

// 6. DOM XSS (Client-Side Logic simulation)
function renderUser(name) {
    // Vulnerable: direct innerHTML assignment
    document.getElementById('user').innerHTML = "Welcome " + name;
}

// 7. WEAK CRYPTO & PASSWORD
function hashPassword(pass) {
    if (pass.length < 5) return "Too short"; // Weak password policy
    return require('crypto').createHash('md5').update(pass).digest('hex'); // Weak MD5
}

// 8. PROTOTYPE POLLUTION
function updateObject(obj, key, value) {
    // Vulnerable recursive merge
    obj[key] = value; // Potential __proto__ access
}

// 9. INTERNAL IP LEAK
const internalConfig = {
    serverIp: "192.168.1.55", // Private IP disclosure
    port: 8080
};

// 10. UNSAFE REGEX (ReDoS)
app.get('/search', (req, res) => {
    // Vulnerable to catastrophic backtracking
    const regex = new RegExp(req.query.pattern);
    const match = "some text".match(regex);
});
