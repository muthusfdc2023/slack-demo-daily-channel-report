// databasejs.js
// This file requires the following package: npm install mysql2 dotenv

import mysql from 'mysql2/promise';
import dotenv from "dotenv";

// Load environment variables (important if this file is the entry point for database operations)
dotenv.config(); 

// --- Connection Pool Configuration ---
const pool = mysql.createPool({
    // Essential Connection Details from .env
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Use DB_PORT if defined, otherwise default to 3306

    // Connection Pooling Settings
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    
    // 💡 Added for Resilience: Explicitly set connection timeout (in milliseconds)
    // A longer timeout can sometimes bypass transient network issues.
    connectTimeout: 15000, // 15 seconds

    // 🔒 Added for Cloud Compatibility: SSL/TLS Configuration
    // Many cloud databases (like Render's own PostgreSQL or external MySQL) require SSL.
    // Set DB_ENABLE_SSL=true in your .env or Render dashboard if required by your provider.
    ssl: process.env.DB_ENABLE_SSL === 'true' ? {
        // This is often required for self-signed certificates or specific cloud setups
        rejectUnauthorized: true, 
        // If your host provides a CA certificate, you may need to add:
        // ca: fs.readFileSync('./path/to/your/db_ca.crt') 
    } : undefined,
});
// -------------------------------------

/**
 * Inserts the daily Slack metrics into the dailyreport table, 
 * updating the record if a report for the date already exists.
 * * @param {string} dateString - The date of the report (e.g., '2025-11-20').
 * @param {number} joins - Number of people joined.
 * @param {number} emojis - Total reactions.
 * @param {number} words - Total words used.
 */
export async function insertDailyReport(dateString, joins, emojis, words) {
    const query = `
        INSERT INTO dailyreport (report_date, people_joined, total_reactions, words_used)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            people_joined = VALUES(people_joined),
            total_reactions = VALUES(total_reactions),
            words_used = VALUES(words_used);
    `;
    
    const values = [dateString, joins, emojis, words];

    try {
        const [result] = await pool.execute(query, values);
        console.log(`[DB] Report inserted/updated successfully.`);
        return result;
    } catch (error) {
        // CRITICAL: The ETIMEDOUT error occurs here.
        console.error("[DB ERROR] Could not insert daily report:", error);
        // Throw the error so the calling function (generateDailySummary) can handle it.
        throw error;
    }
}

/**
 * Optional: Closes the connection pool. Useful for clean application shutdown.
 */
export async function closePool() {
    try {
        await pool.end();
        console.log("[DB] Connection pool closed.");
    } catch (error) {
        console.error("[DB ERROR] Failed to close connection pool:", error);
    }
}

// Export the pool instance itself in case other parts of the app need direct queries
export default pool;

// import express from "express";
// import db from "./db.js";

// const app = express();
// app.use(express.json());

// // INSERT
// app.post("/add-user", async (req, res) => {
//   const { name, email } = req.body;

//   try {
//     const [result] = await db.query(
//       "INSERT INTO users (name, email) VALUES (?, ?)",
//       [name, email]
//     );

//     res.json({ message: "User added", userId: result.insertId });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // UPDATE
// app.put("/update-user/:id", async (req, res) => {
//   const { id } = req.params;
//   const { name, email } = req.body;

//   try {
//     const [result] = await db.query(
//       "UPDATE users SET name = ?, email = ? WHERE id = ?",
//       [name, email, id]
//     );

//     res.json({ message: "User updated", affected: result.affectedRows });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(3000, () => console.log("Server started at port 3000"));
