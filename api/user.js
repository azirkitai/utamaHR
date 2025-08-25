const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key-for-testing');
      return res.status(200).json({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      });
    } catch (jwtError) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};