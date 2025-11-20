
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import { insertDailyReport } from "./databasejs.js";

dotenv.config();

const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

// New function for handling schedule commands
export async function processScheduleCommand(payload) {
    try {
        const commandText = payload.text;
        const channelId = payload.channel_id;

        // 1. **Data Logic:** Update the database based on commandText
        // await database.updateSchedule(commandText, payload.user_id);

        // 2. **Report Generation:** Generate the summary message
        const summary = `Schedule updated! New summary: ${commandText}`;

        // 3. **Post to Channel:** Send the final message back to Slack
        await client.chat.postMessage({
            channel: channelId,
            text: summary
        });

    } catch (error) {
        console.error('Error processing command:', error);
    }
}

// 1. Fetch Stats
export async function generateSlackStats(channelId, clientInstance = client) {
    console.log(`Fetching stats for channel: ${channelId}`);
    const twentyFourHoursAgo = (Math.floor(Date.now() / 1000) - 24 * 60 * 60).toString();

    let totalWords = 0;
    let totalEmojis = 0;
    let totalJoins = 0;
    let cursor;

    do {
        const response = await clientInstance.conversations.history({
            channel: channelId,
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

    return { totalWords, totalEmojis, totalJoins };
}

// 2. Save to DB
export async function saveToDB(channelId, stats) {
    const dbDate = new Date().toISOString().split('T')[0];
    await insertDailyReport(dbDate, stats.totalJoins, stats.totalEmojis, stats.totalWords);
}

// 3. Post Summary
export async function postSummary(channelId, stats, clientInstance = client, title = "Daily Metrics Summary") {
    const displayDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    await clientInstance.chat.postMessage({
        channel: channelId,
        text: `${title} for ${displayDate}`,
        blocks: [
            {
                type: "header",
                text: { type: "plain_text", text: `📊 ${title}` }
            },
            { type: "divider" },
            {
                type: "rich_text",
                elements: [
                    {
                        type: "rich_text_section",
                        elements: [
                            { type: "text", text: `Report for ${displayDate}\n\n`, style: { bold: true } }
                        ]
                    },
                    {
                        type: "rich_text_preformatted",
                        elements: [
                            { type: "text", text: "Date       | Reactions | Joined | Words\n" },
                            { type: "text", text: "-----------|-----------|--------|-------\n" },
                            { type: "text", text: `${displayDate.padEnd(11)}| ${stats.totalEmojis.toString().padEnd(10)}| ${stats.totalJoins.toString().padEnd(7)}| ${stats.totalWords}` }
                        ]
                    }
                ]
            }
        ]
    });
    console.log(`[Slack] Report posted successfully.`);
}

// Wrapper for backward compatibility / Cron
export async function generateDailySummary() {
    console.log("Starting Daily Summary Generation...");
    try {
        const stats = await generateSlackStats(TARGET_CHANNEL_ID);
        await saveToDB(TARGET_CHANNEL_ID, stats);
        await postSummary(TARGET_CHANNEL_ID, stats);
    } catch (error) {
        console.error("Error generating daily report:", error);
    }
}