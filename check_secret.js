
import dotenv from 'dotenv';
dotenv.config();
console.log("SLACK_SIGNING_SECRET:", process.env.SLACK_SIGNING_SECRET ? "SET" : "MISSING");
