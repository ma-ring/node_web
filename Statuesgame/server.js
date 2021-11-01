const express = require('express');
const app = express();
const https = require('https');

const PORT = process.env.PORT | 3000;

const fs = require('fs');
var options = {
  key:  fs.readFileSync('privatekey.pem'),
  cert: fs.readFileSync('cert.pem')
};

var server = https.createServer(options, app);

app.use(express.static('public'));

server.listen(PORT,()=> {
  console.log('start listen at ' + PORT); 

});
