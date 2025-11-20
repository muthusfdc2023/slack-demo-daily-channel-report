// databasejs.js
// This file requires the following package: npm install mysql2 dotenv

import mysql from 'mysql2/promise';
import dotenv from "dotenv";

// Load environment variables (critical for process.env access)
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
    
    // Resilience: Set a generous connection timeout (15 seconds)
    // If the network takes longer than this to respond, the connection fails.
    connectTimeout: 15000, 

    // Cloud Compatibility: SSL/TLS Configuration
    // Set DB_ENABLE_SSL=true in your .env or Render dashboard if your provider requires SSL.
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
 * @param {string} dateString - The date of the report (e.g., '2025-11-20').
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
        // This is the line where the ETIMEDOUT error is being thrown.
        const [result] = await pool.execute(query, values);
        console.log(`[DB] Report inserted/updated successfully.`);
        return result;
    } catch (error) {
        // CRITICAL: Ensure the ETIMEDOUT error is logged clearly
        console.error("[DB ERROR] Could not insert daily report:", error);
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

// Export the pool instance
export default pool;