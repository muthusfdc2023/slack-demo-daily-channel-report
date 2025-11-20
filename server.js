import express from "express";
import cron from "node-cron";
import { generateDailySummary } from "./reporter.js"; // Your existing reporting logic
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// --- Middleware Setup ---
// Slack commands send data as x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// --- Configuration ---
// The PORT is critical. Render sets process.env.PORT, and 3000 is a safe fallback for local testing.
const PORT = process.env.PORT || 3000; 

// CRITICAL: Ensure SLACK_VERIFICATION_TOKEN is set in your .env or Render environment
const SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN; 

// --- HEALTH CHECK / ROOT ENDPOINT ---
app.get("/", (req, res) => {
    res.send("Cron job and Slack command service running...");
});

// ----------------------------------------------------------------------
// ## 🤖 SLACK SLASH COMMAND ENDPOINT
// This handles the manual, on-demand trigger when a user types /yourcommand
// ----------------------------------------------------------------------
app.post("/slack/commands", async (req, res) => {
    console.log("Received Slack command:", req.body.command);
    
    // 1. Security Check
    // Verifies the request came from your registered Slack app.
    if (req.body.token !== SLACK_VERIFICATION_TOKEN) {
        // Return 403 Forbidden on token mismatch.
        return res.status(403).send("Verification token mismatch. Access denied.");
    }
    
    // 2. Immediate Acknowledgment (CRITICAL for Slack's 3-second timeout)
    // Send a response instantly to prevent the user seeing an error message in Slack.
    res.send("Generating daily summary report now! Check the channel shortly.");
    
    // 3. Execute Core Logic Asynchronously
    // The main, time-consuming work runs here in the background.
    try {
        await generateDailySummary();
        console.log("Slash command: Daily summary report execution finished.");
    } catch (error) {
        // Log the error (e.g., the ETIMEDOUT database error)
        console.error("Slash command: Failed to run daily summary:", error);
    }
});

// ----------------------------------------------------------------------
// ## ⏰ CRON JOB SCHEDULER
// This runs automatically based on the schedule.
// ----------------------------------------------------------------------
cron.schedule(
    "*/5 * * * *", // Current schedule: runs every 5 minutes (for testing)
    () => {
        console.log("Running scheduled daily summary report...");
        generateDailySummary();
    },
    {
        // Set the appropriate timezone for accurate scheduling
        timezone: "Asia/Kolkata", 
    }
);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});