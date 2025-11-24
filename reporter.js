import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import { insertDailyReport } from "./databasejs.js";

dotenv.config();

const TARGET_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

/*------------------------------------------------------
    1. Slash Command Handler
------------------------------------------------------*/
export async function processScheduleCommand(payload) {
    try {
        const commandText = payload.text;
        const channelId = payload.channel_id;

        const summary = `Schedule updated! New summary: ${commandText}`;

        await client.chat.postMessage({
            channel: channelId,
            text: summary
        });

    } catch (error) {
        console.error("Error processing command:", error);
    }
}

/*------------------------------------------------------
    2. Fetch Slack Stats (last 24 hours)
------------------------------------------------------*/
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
            cursor
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

/*------------------------------------------------------
    3. Save to MySQL DB
------------------------------------------------------*/
export async function saveToDB(channelId, stats) {
    const dbDate = new Date().toISOString().split("T")[0];
    await insertDailyReport(dbDate, stats.totalJoins, stats.totalEmojis, stats.totalWords);
}

/*------------------------------------------------------
    4. Post Summary TABLE BLOCK (Updated)
------------------------------------------------------*/
export async function postSummary(
    channelId,
    stats,
    clientInstance = client,
    title = "Daily Metrics Summary"
) {

    const reportDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const { totalWords, totalEmojis, totalJoins } = stats;

    await clientInstance.chat.postMessage({
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

            { type: "divider" },

            {
                type: "table",
                border: 1,
                width: 4,
                columns: [
                    { type: "plain_text", text: "Date" },
                    { type: "plain_text", text: "Reactions" },
                    { type: "plain_text", text: "People Joined" },
                    { type: "plain_text", text: "Words Used" }
                ],
                rows: [
                    [
                        { type: "plain_text", text: reportDate },
                        { type: "plain_text", text: totalEmojis.toString() },
                        { type: "plain_text", text: totalJoins.toString() },
                        { type: "plain_text", text: totalWords.toString() }
                    ]
                ],
                column_widths: [40, 30, 30, 30],
                align: ["left", "center", "center", "right"]
            },

            { type: "divider" }
        ]
    });

    console.log("[Slack] Table-based report posted successfully.");
}

/*------------------------------------------------------
    5. Cron Wrapper
------------------------------------------------------*/
export async function generateDailySummary() {
    console.log("Starting Daily Summary...");

    try {
        const stats = await generateSlackStats(TARGET_CHANNEL_ID);
        await saveToDB(TARGET_CHANNEL_ID, stats);
        await postSummary(TARGET_CHANNEL_ID, stats);
    } catch (error) {
        console.error("Error generating daily report:", error);
    }
}
