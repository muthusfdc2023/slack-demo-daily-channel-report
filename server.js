// Inside server.js or a dedicated scheduler.js file
import cron from 'node-cron';
import { generateDailySummary } from './reporter.js';

// Run once immediately
//generateDailySummary().catch(console.error);


// Schedule daily at 09:00 IST
cron.schedule('50 16 * * *', async () => {
  console.log('Running daily summary report...');
  await generateDailySummary();
}, { timezone: 'Asia/Kolkata' });

// Your existing server start code follows...
// app.listen(...)





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