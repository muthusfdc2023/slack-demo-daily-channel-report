
import dotenv from 'dotenv';
dotenv.config();
console.log("SLACK_VERIFICATION_TOKEN:", process.env.SLACK_VERIFICATION_TOKEN ? "SET" : "MISSING");
