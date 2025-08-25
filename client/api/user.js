export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Demo user data
    const user = {
      id: 'd1cddd6a-ecd8-4a78-9438-39e9fd455ecc',
      username: 'syedmuhyazir',
      role: 'Super Admin',
      email: 'syed@utama.com'
    };

    return res.status(200).json(user);

  } catch (error) {
    console.error('User fetch error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}