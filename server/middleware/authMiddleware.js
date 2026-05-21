const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || 'qa-tool-secret-key-2024';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid Token' });
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
