require("dotenv").config();
import { Client } from "pg";
import { initConfig } from "../src/config";
import { readFile } from 'fs/promises';


const runMigrations = async () => {
  const config = initConfig();

  const client = new Client(config.Database)

  try {
    // Connect to the PostgreSQL server
    await client.connect();

    // Read the SQL file (ensure your file encoding is 'utf-8')
    const sqlScript = await readFile('./migrations/001_initialize.up.sql', 'utf-8');

    // Execute the SQL script
    await client.query(sqlScript);

    console.log('SQL script executed successfully.');
  } catch (error) {
    console.error('Error executing SQL script:', error);
  } finally {
    // Always close the client connection
    await client.end();
  }
}

runMigrations();
