'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const INPUTS = path.join(__dirname, 'inputs.html');
const OUTPUT = path.join(__dirname, 'output.html');

const server = express()
  .use((req, res) => {
    var url = req.url;
    switch (url) {
      case "/inputs":
        res.sendFile(INPUTS);
        break;
      case "/output":
        res.sendFile(OUTPUT);
        break;
      case "/getAllPlayerData":
        getAllPlayerData(res);
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

  // Managing connection
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // Database initialization with heroku postgres
  const { Client } = require('pg');

  const dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  // Now that you're connected, connect to the database.
  dbClient.connect();

  // Have some drafter scores!
  dbClient.query('SELECT * FROM drafter', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      wss.clients.forEach((client) => {
        client.send(row.name + ":" + row.score);
      });
    }

    // some player scores, too!
    dbClient.query('SELECT * FROM player', (playerErr, playerRes) => {
      if (playerErr) throw playerErr;
      for (let row of res.rows) {
        wss.clients.forEach((client) => {
          client.send(row.name + ":" + row.score);
        });
      }

      // We got 'em all, we can close the connection now.
      dbClient.end();
    });
  });

  ws.on('close', () => console.log('Client disconnected'));

  ws.on('message', function incoming(data){
    if (data === "BADA BOINGUS") {
      // Our mission is simple. We must 'Bada Boingus'
      wss.clients.forEach((client) => {
        client.send(data);
      });
    }
    else {
      // Database initialization with heroku postgres
      const { Client } = require('pg');

      const dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
      });

      dbClient.connect();

      if (data[0] === "!") {
        // we are managing the elimination of a player
        var eliminatedPlayerName = data.substring(1);

        dbClient.query("UPDATE player SET eliminated = True where name = '" + eliminatedPlayerName + "'", (err, res) => {
          if (err) throw err;
          dbClient.end();
        });
      }
      else if (data[0] === ".") {
        // we are managing the un-elimination of a player (oops!)
        var revivedPlayerName = data.substring(1);

        dbClient.query("UPDATE player SET eliminated = False where name = '" + revivedPlayerName + "'", (err, res) => {
          if (err) throw err;
          dbClient.end();
        });
      }
      // we are just updating a score
      else {
        var splitData = data.split(":");
        var name = splitData[0];
        var score = splitData[1];

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
      }
    }
  });
});

// Functionality to keep connections alive while open.
function emptyPing() {}

function heartbeat() {
  this.isAlive = true;
}

// Keep connections alive with pings
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(emptyPing);
  });
}, 10000);

function getAllPlayerData(expressResponse) {
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
    return expressResponse.json(response);
  });
}
