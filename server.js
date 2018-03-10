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
  ws.on('close', () => console.log('Client disconnected'));

  ws.on('message', function incoming(data){
    wss.clients.forEach((client) => {
      client.send(data);
    });
  });
});
