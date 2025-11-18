// databasejs.js (Assuming you use the modern mysql2/promise)

import mysql from 'mysql2/promise';

// Connection pool configuration uses the .env file variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * 
 * Inserts the daily Slack metrics into the dailyreport table.
 * @param {string} dateString - The date of the report (e.g., '2025-11-17').
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
    
    // The ON DUPLICATE KEY UPDATE ensures that if you run the report twice on the same day,
    // it updates the existing row instead of throwing an error.

    const values = [dateString, joins, emojis, words];

    try {
        const [result] = await pool.execute(query, values);
        console.log(`[DB] Report inserted/updated successfully. Row ID: ${result.insertId || 'N/A (Updated Existing)'}`);
        return result;
    } catch (error) {
        console.error("[DB ERROR] Could not insert daily report:", error);
        throw error;
    }
}


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
