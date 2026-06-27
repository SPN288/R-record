const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === expectedUsername && password === expectedPassword) {
    const token = jwt.sign(
      { username: expectedUsername, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    return res.json({ token, username });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Verify token route (to check if token in localStorage is still valid)
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    return res.json({ valid: true });
  } catch (err) {
    return res.status(401).json({ valid: false });
  }
});

module.exports = router;
