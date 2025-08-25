export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Demo authentication - accept any password for syedmuhyazir
    if (username === 'syedmuhyazir') {
      const token = 'demo-jwt-token-' + Date.now();
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: 'd1cddd6a-ecd8-4a78-9438-39e9fd455ecc',
          username: 'syedmuhyazir',
          role: 'Super Admin'
        }
      });
    }

    return res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}