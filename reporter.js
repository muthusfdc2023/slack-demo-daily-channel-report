// reporter.js
// This file requires the following package: npm install @slack/web-api dotenv mysql2

import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
//import { insertDailyReport } from "./databasejs.js"; // Import the database function
dotenv.config();

// --- Configuration ---
const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID; 

// Initialize the Slack Web Client
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Fetches channel history for the last 24 hours, calculates metrics, saves to DB, and posts a summary.
 */
async function generateDailySummary() {
    // Calculate Unix timestamp for 24 hours ago
    const dbModule = await import("./databasejs.js");
    const insertDailyReport = dbModule.insertDailyReport;
    let totalMembers = 0;
    try {
        const infoResponse = await client.conversations.info({
            channel: TARGET_CHANNEL_ID
        });
        if (infoResponse.ok && infoResponse.channel) {
            // conversations.info returns num_members
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
            await insertDailyReport(dbDate, totalJoins, totalEmojis, totalWords);
            console.log(`[DB] Successfully saved report for ${dbDate}.`);
        } catch (dbError) {
            console.error("CRITICAL: Failed to save report to database.", dbError);
        }
        // --- END DATABASE SAVE ---


        // 3. Post the Final Summary Message (Using 4 sections for guaranteed 4-column alignment)
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
                    // Using the table block for consistent 4-column layout
                    "type": "table",
                    "rows": [
                        // ROW 1: HEADERS
                        [
                            { "type": "raw_text", "text": "Date" },
                            { "type": "raw_text", "text": "Total Reactions" },
                            { "type": "raw_text", "text": "People Joined" },
                            { "type": "raw_text", "text": "Words Used" }
                        ],
                        // ROW 2: DATA (Using the calculated variables)
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

// Execute the function
// Export the function for external use (e.g. scheduler in server.js)
export { generateDailySummary };