const express = require('express');
const app = express();
const port = 80;

// Simple HTML page for Bean & Bloom Coffee Shop
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bean & Bloom Coffee Shop</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #6B4423 0%, #3E2723 100%);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        h1 {
          font-size: 3em;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .emoji {
          font-size: 4em;
          margin: 20px 0;
        }
        p {
          font-size: 1.2em;
          margin: 10px 0;
        }
        .menu {
          margin-top: 30px;
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .menu-item {
          background: rgba(255, 255, 255, 0.2);
          padding: 15px 25px;
          border-radius: 10px;
          min-width: 150px;
        }
        .status {
          margin-top: 30px;
          padding: 15px;
          background: rgba(76, 175, 80, 0.3);
          border-radius: 10px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="emoji">☕</div>
        <h1>Bean & Bloom</h1>
        <p>Artisan Coffee Shop</p>
        <p>🌸 Where Every Cup Blooms with Flavor 🌸</p>
        
        <div class="menu">
          <div class="menu-item">
            <h3>Espresso</h3>
            <p>$3.50</p>
          </div>
          <div class="menu-item">
            <h3>Cappuccino</h3>
            <p>$4.50</p>
          </div>
          <div class="menu-item">
            <h3>Latte</h3>
            <p>$4.75</p>
          </div>
          <div class="menu-item">
            <h3>Cold Brew</h3>
            <p>$5.00</p>
          </div>
        </div>

        <div class="status">
          ✅ Running on Kubernetes - Pod: ${process.env.HOSTNAME || 'local'}
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API endpoint for stats
app.get('/api/stats', (req, res) => {
  res.json({
    shop: 'Bean & Bloom',
    orders_today: Math.floor(Math.random() * 100) + 50,
    revenue: '$' + (Math.random() * 1000 + 500).toFixed(2),
    popular_drink: 'Cappuccino',
    pod: process.env.HOSTNAME || 'local'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`☕ Bean & Bloom Coffee Shop running on port ${port}`);
  console.log(`🚀 Pod: ${process.env.HOSTNAME || 'local'}`);
});
