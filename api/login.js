const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Demo authentication - accept syedmuhyazir with any password
    if (username === 'syedmuhyazir') {
      const token = jwt.sign(
        { 
          id: '1', 
          username: 'syedmuhyazir', 
          role: 'Super Admin' 
        },
        process.env.JWT_SECRET || 'demo-secret-key-for-testing',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: '1',
          username: 'syedmuhyazir',
          role: 'Super Admin',
        },
        token,
      });
    } else {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};