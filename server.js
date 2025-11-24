import { App } from "@slack/bolt";
import cron from "node-cron";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import {
    generateDailySummary,
    generateSlackStats,
    saveToDB,
    postSummary,
    processScheduleCommand
} from "./reporter.js";
import { registerThreadSentimentHandlers } from "./threadSentiment.js";

dotenv.config();

// EXPRESS APP -------------------------
const expressApp = express();
const PORT = process.env.PORT || 3000;

console.log("Loaded SLASH_SECRET:", process.env.SLASH_SECRET);

expressApp.use(bodyParser.urlencoded({ extended: true }));

// BOLT APP ----------------------------
const boltApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    customRoutes: [
        {
            path: '/',
            method: ['GET'],
            handler: (req, res) => {
                res.writeHead(200);
                res.end('Service is running.');
            },
        },
    ],
});

registerThreadSentimentHandlers(boltApp);

// SLASH COMMAND ------------------------
boltApp.command('/dailyreport', async ({ ack, body, client }) => {
    await ack();

    const channelId = body.channel_id;

    try {
        const stats = await generateSlackStats(channelId, client);
        await saveToDB(channelId, stats);
        await postSummary(channelId, stats, client, 'Last 24 hours report (slash)');
    } catch (err) {
        console.error('Slash /dailyreport error', err);
        await client.chat.postMessage({
            channel: channelId,
            text: `:warning: Failed to generate report: ${err.message}`
        });
    }
});

// CRON JOB ------------------------------
cron.schedule(
    "*/5 * * * *",
    () => {
        console.log("Running Scheduled Job...");
        generateDailySummary();
    },
    { timezone: "Asia/Kolkata" }
);

// START BOTH SERVERS -------------------
expressApp.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
});

(async () => {
    await boltApp.start(process.env.BOLT_PORT || 3001);
    console.log(`⚡️ Bolt app is running on port ${process.env.BOLT_PORT || 3001}`);
})();
