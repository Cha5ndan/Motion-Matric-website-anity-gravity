module.exports = async (req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600'
  });
  res.end(JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  }));
};
