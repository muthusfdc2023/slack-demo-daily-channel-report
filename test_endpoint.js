
import http from 'http';
import dotenv from 'dotenv';
import querystring from 'querystring';

dotenv.config();

const PORT = 3000; // Hardcoded to match server default
const TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

console.log(`Testing server on port ${PORT} with token: ${TOKEN ? "FOUND" : "NOT FOUND"}`);

const postData = querystring.stringify({
    token: TOKEN || 'wrong-token',
    command: '/daily-report',
    text: ''
});

const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/slack/commands',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
