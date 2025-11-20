
import { insertDailyReport } from './databasejs.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDB() {
    console.log("Starting DB Test...");
    const date = new Date().toISOString().split('T')[0];
    const randomJoins = Math.floor(Math.random() * 100);
    const randomReactions = Math.floor(Math.random() * 100);
    const randomWords = Math.floor(Math.random() * 1000);

    console.log(`Attempting to insert/update report for ${date} with:`);
    console.log(`Joins: ${randomJoins}, Reactions: ${randomReactions}, Words: ${randomWords}`);

    try {
        const result = await insertDailyReport(date, randomJoins, randomReactions, randomWords);
        console.log("Result:", result);
        if (result.changedRows > 0 || result.affectedRows > 0) {
            console.log("SUCCESS: Database updated.");
        } else {
            console.log("WARNING: No rows changed (values might be identical).");
        }
    } catch (error) {
        console.error("Test Failed:", error);
    }
    process.exit(0);
}

testDB();
