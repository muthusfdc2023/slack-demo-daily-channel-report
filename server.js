
import { App } from "@slack/bolt";
import cron from "node-cron";
import dotenv from "dotenv";
//const app = express();
const { processScheduleCommand } = require('./reporter');
import { generateDailySummary, generateSlackStats, saveToDB, postSummary } from "./reporter.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// app.post('/slack/event/schedule', (req, res) => {
//     // A. Send an immediate 200 OK acknowledgment to Slack
//     res.status(200).send();

//     const payload = req.body; // The data sent by Slack

//     // B. Call the function in reporter.js to handle the long-running logic
//     processScheduleCommand(payload);

//     // The actual response/update to the Slack channel will happen inside reporter.js
// });


const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    // Render health check support (optional, but good practice)
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

// Slash Command Endpoint (Bolt handles verification)
app.command('/dailyreport', async ({ ack, body, client }) => {
    await ack();
    const channelId = body.channel_id;
    try {
        // Use the refactored functions from reporter.js
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

// Cron Job (Every 5 minutes for testing)
cron.schedule("*/5 * * * *", () => {
    console.log("Running Scheduled Job...");
    generateDailySummary();
}, {
    timezone: "Asia/Kolkata"
});

(async () => {
    await app.start(PORT);
    console.log(`⚡️ Bolt app is running on port ${PORT}`);
})();
