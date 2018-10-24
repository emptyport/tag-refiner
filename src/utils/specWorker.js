let { spectralProcessor } = require('../utils/spectralProcessor');
const WebSocket = require('ws');
let args = process.argv[2];

console.log("\n");
console.log(args);
console.log("\n");

args = JSON.parse(args);

const wss = new WebSocket.Server( { port: 3000 } );

wss.on('connection', function connection(ws) {
  args.fileList.map(file => {
    let filename = file.file;
    let index = file.id;
    let options = args.options;
    let specGen = spectralProcessor(filename, options, index);
  
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
  process.exit(0);
});



