import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function testDb() {
  try {
    console.log('Using DB host:', process.env.DB_HOST);
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [one] = await conn.query('SELECT 1 AS ok');
    console.log('Simple query result:', one);

    const [tables] = await conn.query("SHOW TABLES");
    console.log('Found tables (first 20):', tables.slice(0, 20));

    await conn.end();
    console.log('DB connection test succeeded.');
  } catch (err) {
    console.error('DB Test Error:', err && err.message ? err.message : err);
    if (err && err.code) console.error('MySQL error code:', err.code);
    process.exitCode = 1;
  }
}

testDb();
