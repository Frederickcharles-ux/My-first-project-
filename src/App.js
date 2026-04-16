import { useState, useEffect } from "react";
import { SpeedInsights } from '@vercel/speed-insights/react';

// --- GLOBAL CONFIG & DB KEYS ---
const DB_KEYS = {
  items: "freshkid-products",
  orders: "freshkid-orders",
  vault: "freshkid-admin-pw",
};

// Quick fix for currency formatting
const naira = (amt) => "₦" + Number(amt).toLocaleString("en-NG");

const CATEGORY_THEMES = {
  "New": "#00c853",
  "UK Used": "#2979ff",
  "Nigeria Used": "#ff6d00",
  "Refurbished": "#aa00ff",
};

// Helper function for local storage
const loadData = async (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Default products data
const defaultProducts = [
  { id: 1, name: "iPhone 13", condition: "UK Used", price: 450000 },
  { id: 2, name: "Samsung Galaxy S21", condition: "New", price: 380000 },
  { id: 3, name: "MacBook Air M1", condition: "Refurbished", price: 650000 },
];

// --------------------------------------------------------
// TELEGRAM NOTIFIER
// --------------------------------------------------------
// eslint-disable-next-line no-unused-vars
async function pingAdmin(orderData) {
  const config = await loadData("freshkid-tg-settings", null);
  if (!config?.token || !config?.chatId) return;

  const summary = orderData.items
    .map(i => `• ${i.name} (${i.condition}) x${i.qty}`)
    .join("\n");

  const text = `🚀 *NEW FRESHKID ORDER*\n\n` +
               `Client: ${orderData.name}\n` +
               `Phone: ${orderData.phone}\n\n` +
               `Items:\n${summary}\n\n` +
               `Total: ${naira(orderData.total)}`;

  try {
    await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: config.chatId, 
        text, 
        parse_mode: "Markdown" 
      }),
    });
  } catch (err) {
    console.error("TG Alert Failed:", err);
  }
}

// --------------------------------------------------------
// CORE APP LOGIC
// --------------------------------------------------------
export default function FreshKidApp() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      const [p] = await Promise.all([
        loadData(DB_KEYS.items, defaultProducts),
        loadData(DB_KEYS.orders, [])
      ]);
      setProducts(p);
      setLoading(false);
    }
    init();
  }, []);

  const handleAddToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading Freshkid Gadgets Hub...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎮 Freshkid Gadgets Hub</h1>
      <div>
        <h2>Available Products</h2>
        {products.map(product => (
          <div key={product.id} style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <h3>{product.name}</h3>
            <p>Condition: <span style={{ color: CATEGORY_THEMES[product.condition] }}>
              {product.condition}
            </span></p>
            <p>Price: {naira(product.price)}</p>
            <button onClick={() => handleAddToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <h2>Shopping Cart ({cart.length} items)</h2>
        {cart.map(item => (
          <div key={item.id} style={{ padding: '5px 0' }}>
            {item.name} x {item.qty} = {naira(item.price * item.qty)}
          </div>
        ))}
      </div>
      <SpeedInsights />
    </div>
  );
}
