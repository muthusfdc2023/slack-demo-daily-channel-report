// Inside server.js or a dedicated scheduler.js file
import cron from 'node-cron';
import express from 'express';
import dotenv from 'dotenv';

// Do not import reporter at top-level to avoid hard failures during module load.
// We'll lazy-load it when a run is required.
let generateDailySummary;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (Render uses this to verify service is running)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Utility to lazily import reporter and cache the function reference.
async function loadReporter() {
  if (generateDailySummary) return generateDailySummary;
  try {
    const mod = await import('./reporter.js');
    if (!mod || typeof mod.generateDailySummary !== 'function') {
      throw new Error('reporter.js does not export generateDailySummary');
    }
    generateDailySummary = mod.generateDailySummary;
    return generateDailySummary;
  } catch (err) {
    console.error('Failed to load reporter module:', err && err.message ? err.message : err);
    throw err;
  }
}

// Optional: endpoint to manually trigger the report
app.post('/run-report', async (req, res) => {
  try {
    const fn = await loadReporter();
    await fn();
    res.status(200).send('Report triggered successfully');
  } catch (err) {
    console.error('Manual run failed:', err);
    res.status(500).send(`Error: ${err && err.message ? err.message : 'unknown'}`);
  }
});

// Start the HTTP server first to ensure Render sees an open port even
// if later initialization or scheduled jobs fail.
app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Global error handlers to avoid process exit for transient errors.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// Schedule daily at 16:50 IST (3:50 PM)
cron.schedule('40 12 * * *', async () => {
  console.log('Scheduled run: Running daily summary report...');
  try {
    const fn = await loadReporter();
    await fn();
  } catch (err) {
    console.error('Scheduled run failed:', err);
  }
}, { timezone: 'Asia/Kolkata' });





// import http from 'http'; // http - module

// const PORT =process.env.PORT;
// const server = http.createServer((req,res)=>{

  
//    //res.write('hello world');
//    //res.end('hello world'); 
//    //res.setHeader('Content-Type','text/plain');
//    res.setHeader('Content-Type','text/html');
//  //  res.statusCode = 200;
//  console.log(req.url);
//  console.log(req.method);
//   //  res.writeHead(500,{'Content-Type':'text/plain'});
//   //  res.end(JSON.stringify({ MESSAGE :'Internal server error'}));

//     res.writeHead(200,{'Content-Type':'text/html'});
//     res.end('<h1>Hello World</h1>');
   
//    // when it express - no need to end response manually , it automatically ends
// });

// server.listen(PORT, ()=>{
//     console.log(`server is running on port ${PORT}`);
// });