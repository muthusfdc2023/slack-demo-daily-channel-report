import express from "express";
import cron from "node-cron";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { generateDailySummary } from "./reporter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
    res.send("Service is running.");
});

// Slash Command Endpoint
app.post("/slack/commands", async (req, res) => {
    console.log("Incoming Slash Command...");

    // 1. Verify Token
    if (req.body.token !== SLACK_VERIFICATION_TOKEN) {
        console.error("Token mismatch!");
        return res.status(403).send("Access Denied");
    }

    // 2. ACK immediately (Required by Slack)
    res.status(200).send("Working on it! 📊 Report will appear shortly.");

    // 3. Run logic in background
    generateDailySummary();
});

// Cron Job (Every 5 minutes for testing)
cron.schedule("*/5 * * * *", () => {
    console.log("Running Scheduled Job...");
    generateDailySummary();
}, {
    timezone: "Asia/Kolkata"
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});