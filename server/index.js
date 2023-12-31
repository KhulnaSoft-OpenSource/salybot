require('dotenv').config()
const WebSocket = require('ws');
const express = require('express');

// install with: npm install @octokit/webhooks
const { Webhooks } = require("@octokit/webhooks");

// setup the webhooks
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

webhooks.onAny(({ id, name, payload }) => {
  const output = payload.sender.login
  console.log(output);
  // message = output;
  
  // broadcast the message to all of the connected clients
  // wss is a server that contains clients which are an array
  // of all of the websocket connections
  if(wss && wss.clients) {
    wss.clients.forEach(client => {
      client.send(output)
    })
  }
});

webhooks.onError((error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});

// setup express
const app = express();

// add middleware to server the static files
app.use(express.static('client'))

// add middleware for the webhooks
app.use(webhooks.middleware)

//initialize the server to be used by the websockets
const PORT = process.env.PORT || 3000
app.set('port', PORT);
const server = app.listen(app.get('port'), () => console.log(`Server started on port ${PORT}`))


//add the WebSocket to the server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        //log the received message and send it back to the client
        console.log('received: %s', message);
        ws.send(JSON.stringify(message));
    });

    //send immediate feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});
