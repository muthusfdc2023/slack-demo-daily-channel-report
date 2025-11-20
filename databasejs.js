import mysql from 'mysql2/promise';
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 5, // Lower limit is safer for free/cheap tiers
    connectTimeout: 20000, // Increased timeout
    // logic to handle SSL if your DB provider requires it (Azure/AWS often do)
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
        console.log(`[DB] Report saved for ${dateString}`);
        return result;
    } catch (error) {
        console.error("[DB ERROR] Insert failed:", error.message);
        // We do not throw here to ensure the Slack message still attempts to send
    }
}

export default pool;