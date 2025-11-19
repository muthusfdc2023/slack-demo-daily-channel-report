// merged_app.js (Recommended to use .mjs extension or set "type": "module" in package.json)

// --- 1. Imports (Consolidated from all files) ---
import cron from 'node-cron'; // from server.js
import { WebClient } from "@slack/web-api"; // from reporter.js
import dotenv from "dotenv"; // from reporter.js
import mysql from 'mysql2/promise'; // from databasejs.js

dotenv.config();

// --- 2. Database Module (from databasejs.js) ---
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
 * Inserts the daily Slack metrics into the dailyreport table.
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
        console.log(`[DB] Report inserted/updated successfully. Row ID: ${result.insertId || 'N/A (Updated Existing)'}`);
        return result;
    } catch (error) {
        console.error("[DB ERROR] Could not insert daily report:", error);
        throw error;
    }
}


// --- 3. Reporter Logic (from reporter.js) ---
const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID; 
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Fetches channel history for the last 24 hours, calculates metrics, saves to DB, and posts a summary.
 */
async function generateDailySummary() {
    // Note: The dynamic import of "./databasejs.js" is no longer needed
    // because insertDailyReport is now defined in the same file and is in scope.
    let totalMembers = 0;
    try {
        const infoResponse = await client.conversations.info({
            channel: TARGET_CHANNEL_ID
        });
        if (infoResponse.ok && infoResponse.channel) {
            totalMembers = infoResponse.channel.num_members || 0;
        }
    } catch (e) {
        console.error("Error fetching total channel members:", e.message);
    }

    const twentyFourHoursAgo = (
        Math.floor(Date.now() / 1000) -
        24 * 60 * 60
    ).toString();

    let totalWords = 0;
    let totalEmojis = 0;
    let totalJoins = 0;
    let cursor;


    try {
        // 1. Fetching Data and Counting Metrics (Unchanged)
        do {
            const response = await client.conversations.history({
                channel: TARGET_CHANNEL_ID,
                oldest: twentyFourHoursAgo,
                limit: 1000,
                cursor: cursor,
            });

            if (!response.ok || !response.messages) {
                throw new Error(`Slack API Error: ${response.error}`);
            }

            for (const message of response.messages) {
                if (message.type === "message" && message.text) {
                    const words = message.text.trim().split(/\s+/).filter(Boolean);
                    totalWords += words.length;
                }
                if (message.reactions) {
                    totalEmojis += message.reactions.reduce((sum, reaction) => sum + reaction.count, 0);
                }
                if (message.subtype === "channel_join") {
                    totalJoins += 1;
                }
            }
            cursor = response.response_metadata?.next_cursor;
        } while (cursor);

        // --- DATABASE SAVE ---
        const dbDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for MySQL DATE type
        try {
            // CALLING THE LOCAL FUNCTION
            await insertDailyReport(dbDate, totalJoins, totalEmojis, totalWords); 
            console.log(`[DB] Successfully saved report for ${dbDate}.`);
        } catch (dbError) {
            console.error("CRITICAL: Failed to save report to database.", dbError);
        }
        // --- END DATABASE SAVE ---


        // 3. Post the Final Summary Message
        const reportDate = new Date().toLocaleDateString("en-US", {
            month: "short", 
            day: "numeric", 
            year: "numeric"
        });

        await client.chat.postMessage({
            channel: TARGET_CHANNEL_ID,
            text: `Daily Metrics Summary Report for ${reportDate}`, 
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "📊 Daily Metrics Summary Report"
                    }
                },
                {
                    type: "divider"
                },
                {
                    "type": "table",
                    "rows": [
                        // ROW 1: HEADERS
                        [
                            { "type": "raw_text", "text": "Date" },
                            { "type": "raw_text", "text": "Total Reactions" },
                            { "type": "raw_text", "text": "People Joined" },
                            { "type": "raw_text", "text": "Words Used" }
                        ],
                        // ROW 2: DATA
                        [
                            { "type": "raw_text", "text": reportDate },
                            { "type": "raw_text", "text": totalEmojis.toString() },
                            { "type": "raw_text", "text": totalJoins.toString() },
                            { "type": "raw_text", "text": totalWords.toString() }
                        ]
                    ],
                    // Define alignment for each column
                    "column_settings": [
                        { "align": "left" },
                        { "align": "center" },
                        { "align": "center" },
                        { "align": "right" }
                    ]
                },
                { 
                    type: "divider" 
                }
            ]
        });

        console.log(`Report successfully posted to Slack.`);

    } catch (error) {
        console.error("Failed to run daily report (Slack logic):", error);
    }
}


// --- 4. Scheduler (from server.js) ---

// Schedule the report to run every day at 9:00 AM (e.g., 0 9 * * *)
cron.schedule('0 9 * * *', () => {
    console.log('Running daily summary report...');
    // Calling the function defined in section 3
    generateDailySummary();
}, {
    timezone: "Asia/Kolkata" 
});

// Your existing server start code follows (if needed)
// import express from "express";
// const app = express();
// app.listen(3000, () => console.log("Server started at port 3000"));