'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const INPUTS = path.join(__dirname, 'inputs.html');

const server = express()
  .use((req, res) => {
    var url = req.url;
    switch (url) {
      case "/inputs":
        res.sendFile(INPUTS);
        break;
      case "/getAllPlayerData":
        res.json(getAllPlayerData());
        break;
      default:
        res.sendFile(INDEX);
        break;
      }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Database initialization with heroku postgres
  const { Client } = require('pg');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  // Now that you're connected, connect to the database.
  dbClient.connect();

  // Have some scores!
  dbClient.query('SELECT * FROM drafter', (err, res) => {
    console.log(res);
    if (err) throw err;
    for (let row of res.rows) {
      wss.clients.forEach((client) => {
        client.send(row.name + ":" + row.score);
      });
    }
    dbClient.end();
  });

  ws.on('close', () => console.log('Client disconnected'));

  ws.on('message', function incoming(data){
    var splitData = data.split(":");
    var name = splitData[0];
    var score = splitData[1];

    // Database initialization with heroku postgres
    const { Client } = require('pg');

    const dbClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    });

    dbClient.connect();
    // score update involves first and last name, so is contestant
    if (splitData[0].split(" ").length > 1) {
      // Change some scores!
      dbClient.query("UPDATE player SET score = " + score + " WHERE name = '" + name + "'", (err, res) => {
        if (err) throw err;
        dbClient.end();
      });
    } else {
      // Change some drafter scores!
      dbClient.query("UPDATE drafter SET score = " + score + " WHERE name = '" + name + "'", (err, res) => {
        if (err) throw err;
        dbClient.end();
      });
    }

    wss.clients.forEach((client) => {
      client.send(data);
    });
  });
});

function getAllPlayerData() {
  const { Client } = require('pg');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  dbClient.connect();

  dbClient.query('SELECT * FROM player', (err, resp) => {
    if (err) throw err;
    dbClient.end();

    var responseObject = [];
    for (let row of resp.rows) {
      responseObject.push({
        name: row.name,
        drafterName: row.draftername,
        score: row.score,
        eliminated: row.eliminated
      });
    }

    var response = JSON.stringify(responseObject);
    console.log(response);
    return response;
  });
}
