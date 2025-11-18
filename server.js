// Inside server.js or a dedicated scheduler.js file
const cron = require('node-cron');
const { generateDailySummary } = require('./reporter'); // Assuming you export the function

// Schedule the report to run every day at 9:00 AM (e.g., 0 9 * * *)
// Format is: minute hour day-of-month month day-of-week
cron.schedule('0 9 * * *', () => {
  console.log('Running daily summary report...');
  generateDailySummary();
}, {
  // Set the timezone if needed
  timezone: "Asia/Kolkata" // Example: For 9:00 AM IST
});

// Your existing server start code follows...
// app.listen(...)