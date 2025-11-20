import express from "express";
import cron from "node-cron";
import { generateDailySummary } from "./reporter.js"; // Your existing reporting logic
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// --- Middleware Setup ---
// Slack sends form-urlencoded data for slash commands
app.use(bodyParser.urlencoded({ extended: true }));

// --- Configuration ---
const PORT = process.env.PORT || 3306;
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
    if (req.body.token !== SLACK_VERIFICATION_TOKEN) {
        // Return 403 if the token doesn't match the one from Slack's app configuration
        return res.status(403).send("Verification token mismatch. Access denied.");
    }
    
    // 2. Immediate Acknowledgment (Required by Slack within 3 seconds)
    // Send an immediate response so the user doesn't see a "timeout" error.
    res.send("Generating daily summary report now! Check the channel shortly.");
    
    // 3. Execute Core Logic Asynchronously
    // The main work runs in the background, separate from the initial response.
    try {
        await generateDailySummary();
        console.log("Slash command: Daily summary report execution finished.");
    } catch (error) {
        // Log the error for debugging, but the user has already received the acknowledgment.
        console.error("Slash command: Failed to run daily summary:", error);
    }
});

// ----------------------------------------------------------------------
// ## ⏰ CRON JOB SCHEDULER
// This runs automatically based on the schedule, ensuring the automated report.
// ----------------------------------------------------------------------
// NOTE: "*/5 * * * *" runs every 5 minutes (good for testing).
// Use "0 9 * * *" to run every day at 9:00 AM (Asia/Kolkata).
cron.schedule(
    "*/5 * * * *", 
    () => {
        console.log("Running scheduled daily summary report...");
        generateDailySummary();
    },
    {
        // Ensure this is set to the correct timezone for your schedule
        timezone: "Asia/Kolkata", 
    }
);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// import express from "express";
// import cron from "node-cron";
// import { generateDailySummary } from "./reporter.js";

// const app = express();

// // --- KEEP THIS APP RUNNING ON RENDER ---
// const PORT = process.env.PORT || 3000;

// app.get("/", (req, res) => {
//   res.send("Cron job service running...");
// });

// // Start server (Render requires this to stay alive)
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // --- CRON JOB ---
// cron.schedule(
//   "*/5 * * * *",
//   () => {
//     console.log("Running daily summary report...");
//     generateDailySummary();
//   },
//   {
//     timezone: "Asia/Kolkata",
//   }
// );






// // Inside server.js or a dedicated scheduler.js file
// import cron from 'node-cron';
// import { generateDailySummary } from './reporter.js';

// // Schedule the report to run every day at 9:00 AM (e.g., 0 9 * * *)
// // Format is: minute hour day-of-month month day-of-week
// cron.schedule('10 11 * * *', () => {
//   console.log('Running daily summary report...');
//   generateDailySummary();
// }, {
//   // Set the timezone if needed
//   timezone: 'Asia/Kolkata' // Example: For 9:00 AM IST
// });

// // Your existing server start code follows...
// // app.listen(...)node