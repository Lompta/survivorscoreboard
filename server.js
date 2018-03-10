'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const INPUTS = path.join(__dirname, 'inputs.html');

const server = express()
  .use((req, res) => {
    if (req.url === "/inputs") {
      res.sendFile(INPUTS);
    } else {
      res.sendFile(INDEX);
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
        for (let row of res.rows) {
          wss.clients.forEach((client) => {
            client.send(row.name + ":" + row.score);
          });
        }

        // Update drafter score based on new player scores.
        let newDrafterTotal = 0;
        let drafterName = res.rows[0].drafterName;
        dbClient.query("SELECT score from player where drafterName = '" + drafterName + "'", (err, res) => {
          for (let row of res.rows) {
            newDrafterTotal += row.score;

            db.client.query("UPDATE drafter SET score = " + newDrafterTotal + " WHERE name = '" + drafterName + "'", (err, res) => {
              wss.clients.forEach((client) => {
                client.send(row.name + ":" + row.score);
              });
            });
          }
        });

        dbClient.end();
      });
    } else {
      // Change some drafter scores!
      dbClient.query("UPDATE drafter SET score = " + score + " WHERE name = '" + name + "'", (err, res) => {
        if (err) throw err;
        for (let row of res.rows) {
          wss.clients.forEach((client) => {
            client.send(row.name + ":" + row.score);
          });
        }
      );
        dbClient.end();
      });
    }

    wss.clients.forEach((client) => {
      client.send(data);
    });
  });
});
