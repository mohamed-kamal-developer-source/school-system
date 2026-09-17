const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

module.exports = client;
