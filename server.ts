import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("raffle.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    message_code TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_winner BOOLEAN DEFAULT 0,
    eitaa_joined BOOLEAN DEFAULT 0
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // SMS Webhook (Simulating a local SMS gateway)
  app.post("/api/sms-webhook", (req, res) => {
    const { from, message, timestamp } = req.body;
    
    // Logic: Only accept code "9"
    if (message !== "9") {
      return res.status(400).json({ error: "Invalid code" });
    }

    // Time Filtering Logic (Example: 7 PM to 9 PM)
    const date = timestamp ? new Date(timestamp) : new Date();
    const hour = date.getHours();
    
    // Note: In a real scenario, we'd check against event config
    // For demo, we'll allow all but log the time
    
    try {
      const stmt = db.prepare("INSERT OR IGNORE INTO participants (phone, message_code, received_at) VALUES (?, ?, ?)");
      stmt.run(from, message, date.toISOString());
      
      // Eitaa Force Join Simulation
      // Strategy: Send a request to a custom Eitaa Bot that checks membership
      // If joined, update eitaa_joined = 1
      
      res.json({ status: "success", message: "Participant registered" });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // SMS Sync Simulation (Fetching from gateway)
  app.post("/api/sms/sync", (req, res) => {
    // Mocking fetching new messages from a gateway
    const mockMessages = [
      { from: "09121111111", message: "9", timestamp: new Date().toISOString() },
      { from: "09122222222", message: "9", timestamp: new Date().toISOString() },
      { from: "09123333333", message: "9", timestamp: new Date().toISOString() },
      { from: "09124444444", message: "9", timestamp: new Date().toISOString() },
      { from: "09125555555", message: "9", timestamp: new Date().toISOString() },
      { from: "09126666666", message: "9", timestamp: new Date().toISOString() },
      { from: "09127777777", message: "9", timestamp: new Date().toISOString() },
      { from: "09128888888", message: "9", timestamp: new Date().toISOString() },
    ];

    let addedCount = 0;
    const stmt = db.prepare("INSERT OR IGNORE INTO participants (phone, message_code, received_at, eitaa_joined) VALUES (?, ?, ?, ?)");
    
    mockMessages.forEach(msg => {
      // Randomly set eitaa_joined for simulation
      const eitaa = Math.random() > 0.3 ? 1 : 0;
      const info = stmt.run(msg.from, msg.message, msg.timestamp, eitaa);
      if (info.changes > 0) addedCount++;
    });

    res.json({ status: "success", added: addedCount });
  });

  // Eitaa Status Simulation
  app.get("/api/eitaa/status", (req, res) => {
    res.json({ 
      connected: true, 
      channel: "@my_raffle_channel", 
      last_sync: new Date().toISOString() 
    });
  });

  // Get Participants (Filtered by time if needed)
  app.get("/api/participants", (req, res) => {
    const { startTime, endTime } = req.query;
    let query = "SELECT * FROM participants ORDER BY received_at DESC";
    let params = [];

    if (startTime && endTime) {
      query = "SELECT * FROM participants WHERE received_at BETWEEN ? AND ? ORDER BY received_at DESC";
      params = [startTime, endTime];
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  // Draw Winners
  app.post("/api/raffle/draw", (req, res) => {
    const { count = 5 } = req.body;
    
    // Reset previous winners for a fresh draw if needed, or just pick new ones
    // Here we pick from those who haven't won yet and have joined Eitaa
    const eligible = db.prepare("SELECT * FROM participants WHERE is_winner = 0 AND eitaa_joined = 1").all();
    
    if (eligible.length < count) {
      // If not enough Eitaa joined, pick from all for demo purposes
      const allEligible = db.prepare("SELECT * FROM participants WHERE is_winner = 0").all();
      if (allEligible.length === 0) return res.status(400).json({ error: "No eligible participants" });
      
      const winners = allEligible.sort(() => 0.5 - Math.random()).slice(0, count);
      winners.forEach(w => {
        db.prepare("UPDATE participants SET is_winner = 1 WHERE id = ?").run(w.id);
      });
      return res.json(winners);
    }

    const winners = eligible.sort(() => 0.5 - Math.random()).slice(0, count);
    winners.forEach(w => {
      db.prepare("UPDATE participants SET is_winner = 1 WHERE id = ?").run(w.id);
    });

    res.json(winners);
  });

  // Reset Raffle
  app.post("/api/raffle/reset", (req, res) => {
    db.prepare("UPDATE participants SET is_winner = 0").run();
    res.json({ status: "success" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
