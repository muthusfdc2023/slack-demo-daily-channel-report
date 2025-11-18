// Inside server.js or a dedicated scheduler.js file
import cron from 'node-cron';
import express from 'express';
import dotenv from 'dotenv';
import { generateDailySummary } from './reporter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (Render uses this to verify service is running)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Optional: endpoint to manually trigger the report
app.post('/run-report', async (req, res) => {
  try {
    await generateDailySummary();
    res.status(200).send('Report triggered successfully');
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Schedule daily at 16:50 IST (3:50 PM)
cron.schedule('50 16 * * *', async () => {
  console.log('Running daily summary report...');
  await generateDailySummary();
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