import React, { Component } from 'react';
let { spectralProcessor } = require('../utils/spectralProcessor');
const WebSocket = require('ws');

class ConversionServer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      
    };

    const wss = new WebSocket.Server( { port: 3000 } );

    wss.on('connection', function connection(ws) {
      console.log('connection made');
      ws.on('message', function incoming(message) {
        let args = JSON.parse(message);
        args.fileList.map(file => {
          let filename = file.file;
          let index = file.id;
          let options = args.options;
          let specGen = spectralProcessor(filename, options, index);
        
          console.log(filename);

          let result = specGen.next();
          let progress = 0;
          let status = "Processing"
          let message = {progress: progress, status: status, index: index };
          ws.send(JSON.stringify(message));
          while(!result.done) {
            message.progress = result.value.progress;
            message.status = result.value.message;
            ws.send(JSON.stringify(message));
            result = specGen.next();
          }
          message.progress = 100;
          message.status = "Done!";
          ws.send(JSON.stringify(message));
        
        });
      });
    });


   
  }

  render() {

    return (
      <div>
        Hello!        
      </div>
    );
  }
}

export default ConversionServer;
