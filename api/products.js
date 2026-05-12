// api/products.js - Vercel Serverless API
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
  // CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all products
      const products = await getProducts();
      res.status(200).json({ products });
    } 
    else if (req.method === 'POST') {
      // Update products (from admin)
      const { products, adminCode } = req.body;
      
      if (adminCode !== process.env.ADMIN_CODE) {
        return res.status(401).json({ error: 'Invalid admin code' });
      }
      
      await saveProducts(products);
      
      // 🔥 BROADCAST TO ALL CLIENTS
      await pusher.trigger('nexobox-admin', 'product-update', { products });
      
      res.status(200).json({ success: true, message: 'Products updated & broadcasted!' });
    }
    else if (req.method === 'DELETE') {
      // Delete product (from admin)
      const { products, adminCode } = req.body;
      
      if (adminCode !== process.env.ADMIN_CODE) {
        return res.status(401).json({ error: 'Invalid admin code' });
      }
      
      await saveProducts(products);
      
      // 🔥 BROADCAST TO ALL CLIENTS
      await pusher.trigger('nexobox-admin', 'product-delete', { products });
      
      res.status(200).json({ success: true, message: 'Product deleted & broadcasted!' });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// File storage (Vercel doesn't have persistent FS, so use JSON file simulation)
let PRODUCTS_CACHE = null;

async function getProducts() {
  if (PRODUCTS_CACHE) return PRODUCTS_CACHE;
  
  // Default products
  PRODUCTS_CACHE = [
    { icon: '📱', title: 'Smart Wireless Earbuds', desc: 'Premium noise-cancelling earbuds.', price: '$129' },
    { icon: '💻', title: 'Ultra Portable Laptop', desc: 'Lightning-fast performance.', price: '$999' },
    { icon: '⌚', title: 'Smart Fitness Watch', desc: 'AI health insights.', price: '$249' },
    { icon: '🎧', title: 'Over-Ear Headphones', desc: 'Immersive sound.', price: '$199' },
    { icon: '📷', title: '4K Action Camera', desc: 'Stunning 4K video.', price: '$349' },
    { icon: '🔋', title: 'Power Bank 20K', desc: 'Fast charging.', price: '$59' }
  ];
  
  return PRODUCTS_CACHE;
}

async function saveProducts(products) {
  PRODUCTS_CACHE = products;
  // In production, save to database (Vercel Postgres, Supabase, etc.)
  console.log('💾 Products saved:', products.length);
}
