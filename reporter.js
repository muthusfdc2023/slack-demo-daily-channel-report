import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import { insertDailyReport } from "./databasejs.js"; // Standard Import

dotenv.config();

const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID; 
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function generateDailySummary() {
    console.log("Starting Daily Summary Generation...");
    
    // 1. Setup Dates
    const twentyFourHoursAgo = (Math.floor(Date.now() / 1000) - 24 * 60 * 60).toString();
    const dbDate = new Date().toISOString().split('T')[0];
    const displayDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // 2. Calculate Metrics
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
                cursor: cursor,
            });

            if (!response.ok) throw new Error(response.error);

            for (const message of response.messages) {
                if (message.type === "message" && message.text) {
                    const words = message.text.trim().split(/\s+/).filter(Boolean);
                    totalWords += words.length;
                }
                if (message.reactions) {
                    totalEmojis += message.reactions.reduce((sum, r) => sum + r.count, 0);
                }
                if (message.subtype === "channel_join") {
                    totalJoins += 1;
                }
            }
            cursor = response.response_metadata?.next_cursor;
        } while (cursor);

        // 3. Save to DB
        await insertDailyReport(dbDate, totalJoins, totalEmojis, totalWords);

        // 4. Format Message (Using Code Block for Table Alignment)
        // Slack "Table" blocks do not exist in the standard API. We use formatting.
        const tableString = 
`Date       | Reactions | Joined | Words
-----------|-----------|--------|-------
${displayDate.padEnd(11)}| ${totalEmojis.toString().padEnd(10)}| ${totalJoins.toString().padEnd(7)}| ${totalWords}`;

        await client.chat.postMessage({
            channel: TARGET_CHANNEL_ID,
            text: `Daily Metrics for ${displayDate}`,
            blocks: [
                {
                    type: "header",
                    text: { type: "plain_text", text: "📊 Daily Metrics Summary" }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "```" + tableString + "```" // Triple backticks make a nice table
                    }
                }
            ]
        });

        console.log(`[Slack] Report posted successfully.`);

    } catch (error) {
        console.error("Error generating daily report:", error);
    }
}