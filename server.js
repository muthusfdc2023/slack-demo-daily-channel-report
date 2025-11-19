import express from "express";
import cron from "node-cron";
import { generateDailySummary } from "./reporter.js";

const app = express();

// --- KEEP THIS APP RUNNING ON RENDER ---
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Cron job service running...");
});

// Start server (Render requires this to stay alive)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// --- CRON JOB ---
cron.schedule(
  "25 11 * * *",
  () => {
    console.log("Running daily summary report...");
    generateDailySummary();
  },
  {
    timezone: "Asia/Kolkata",
  }
);






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