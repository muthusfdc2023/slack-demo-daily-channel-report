import mysql from 'mysql2/promise';
import dotenv from "dotenv";

dotenv.config();

// DEBUG: Print connection details (Masking password)
console.log("--- DB CONFIG ---");
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Port: ${process.env.DB_PORT || 3306}`);
console.log(`SSL Enabled: ${process.env.DB_ENABLE_SSL === 'true'}`);
console.log("-----------------");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 30000, // 30 Seconds timeout

    // SSL Logic:
    // If you are on Azure/AWS/Google, you usually need this enabled.
    // If you are on Hostinger/cPanel, you usually need this REMOVED or undefined.
    ssl: process.env.DB_ENABLE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

export async function insertDailyReport(dateString, joins, emojis, words) {
    const query = `
        INSERT INTO dailyreport (report_date, people_joined, total_reactions, words_used)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            people_joined = VALUES(people_joined),
            total_reactions = VALUES(total_reactions),
            words_used = VALUES(words_used)
    `;
    
    try {
        const [result] = await pool.execute(query, [dateString, joins, emojis, words]);
        console.log(`[DB] Success! Report saved for ${dateString}`);
        return result;
    } catch (error) {
        console.error("------------------------------------------------");
        console.error("[DB ERROR] Could not connect to Database.");
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        console.error("CHECK FIREWALL SETTINGS: whitelist 0.0.0.0/0");
        console.error("------------------------------------------------");
        // We throw the error so the calling function knows it failed, 
        // but remember reporter.js handles this so Slack still posts.
        throw error;
    }
}

export default pool;