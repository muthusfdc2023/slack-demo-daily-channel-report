// slackfull.js (ESM version)
// Make sure package.json has:  "type": "module"

import express from "express";
import bodyParser from "body-parser";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

/* ================================
   1. DATABASE CONNECTION
================================= */
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
 * Insert or update the daily report into MySQL
 */
async function insertDailyReport(dateString, joins, emojis, words) {
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
        console.log(`[DB] Report saved for ${dateString}`);
        return result;
    } catch (error) {
        console.error("[DB ERROR] Failed to insert/update report:", error);
        throw error;
    }
}


/* ================================
   2. SLACK INITIALIZATION
================================= */
const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const client = new WebClient(process.env.SLACK_BOT_TOKEN);


/* ================================
   3. DAILY SUMMARY FUNCTION
================================= */
async function generateDailySummary() {
    let totalMembers = 0;
    try {
        const infoResponse = await client.conversations.info({
            channel: TARGET_CHANNEL_ID
        });
        if (infoResponse.ok && infoResponse.channel) {
            totalMembers = infoResponse.channel.num_members || 0;
        }
    } catch (e) {
        console.error("Error fetching member count:", e);
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
        do {
            const response = await client.conversations.history({
                channel: TARGET_CHANNEL_ID,
                oldest: twentyFourHoursAgo,
                limit: 1000,
                cursor
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
                    totalEmojis += message.reactions.reduce(
                        (sum, reaction) => sum + reaction.count,
                        0
                    );
                }
                if (message.subtype === "channel_join") {
                    totalJoins += 1;
                }
            }

            cursor = response.response_metadata?.next_cursor;
        } while (cursor);

        const dbDate = new Date().toISOString().split("T")[0];

        await insertDailyReport(dbDate, totalJoins, totalEmojis, totalWords);

        const reportDateText = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        await client.chat.postMessage({
            channel: TARGET_CHANNEL_ID,
            text: `Daily Metrics Summary Report for ${reportDateText}`,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "📊 Daily Metrics Summary Report"
                    }
                },
                { type: "divider" },
                {
                    type: "table",
                    rows: [
                        [
                            { type: "raw_text", text: "Date" },
                            { type: "raw_text", text: "Total Reactions" },
                            { type: "raw_text", text: "People Joined" },
                            { type: "raw_text", text: "Words Used" }
                        ],
                        [
                            { type: "raw_text", text: reportDateText },
                            { type: "raw_text", text: totalEmojis.toString() },
                            { type: "raw_text", text: totalJoins.toString() },
                            { type: "raw_text", text: totalWords.toString() }
                        ]
                    ],
                    column_settings: [
                        { align: "left" },
                        { align: "center" },
                        { align: "center" },
                        { align: "right" }
                    ]
                },
                { type: "divider" }
            ]
        });

        console.log("Report successfully posted.");
    } catch (error) {
        console.error("Daily summary failed:", error);
    }
}


/* ================================
   4. SLASH COMMAND (No CRON)
================================= */
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/slack/command", async (req, res) => {
    const { command, user_name } = req.body;

    console.log("Slash command received:", command);

    if (command === "/dailyreport") {
        res.send("⏳ Running Daily Summary Report… It will appear in the channel shortly.");

        try {
            await generateDailySummary();
        } catch (err) {
            console.error("Error running report manually:", err);
        }
    } else {
        res.send("Unknown command.");
    }
});


/* ================================
   5. START SERVER
================================= */
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
