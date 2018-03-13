// Create database necessary to run the application

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/survivordraft';

const client = new pg.Client(connectionString);
client.connect();

const createDrafterQuery = client.query(
  // TODO - verify maximum num of chars
  'CREATE TABLE drafter(name VARCHAR(20) not null, score integer)');
createDrafterQuery.on('end', () => { createPlayerTable(); });

function createPlayerTable() {
  const createPlayerQuery = client.query(
    'CREATE TABLE player(name VARCHAR(20), score integer, drafterName VARCHAR(20), eliminated boolean)');
  createPlayerQuery.on('end', () => { client.end() });
}
