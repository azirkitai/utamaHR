import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Simple in-memory user store for demo (replace with database in production)
const users = [
  {
    id: '1',
    username: 'syedmuhyazir',
    password: '$2b$10$hashedpassword', // This should be hashed
    role: 'Super Admin'
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.url || '';

    if (path.includes('/login') && req.method === 'POST') {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Find user (replace with database query)
      const user = users.find(u => u.username === username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // For demo purposes, accept any password for 'syedmuhyazir'
      // In production, use proper password hashing
      if (username === 'syedmuhyazir') {
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        return res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
          token,
        });
      } else {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    if (path.includes('/user') && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        return res.json({
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
        });
      } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}