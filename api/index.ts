// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Parse the request path to route to correct handler
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
    
    // Simple routing for common endpoints
    if (path.includes('/login')) {
      // Handle login
      if (req.method === 'POST') {
        return res.json({ message: "Login endpoint - under construction" });
      }
    }
    
    if (path.includes('/user')) {
      // Handle user info
      if (req.method === 'GET') {
        return res.json({ message: "User endpoint - under construction" });
      }
    }
    
    // Default response
    return res.json({ 
      message: "API endpoint", 
      path: path,
      method: req.method 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}