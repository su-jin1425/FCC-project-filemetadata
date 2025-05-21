var express = require('express');
var cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
var app = express();
app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.urlencoded({ extended: true }));
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
app.post('/api/fileanalyse', function(req, res) {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Missing multipart/form-data' });
  }
  let body = '';
  let boundary = req.headers['content-type'].split('boundary=')[1];
  let fileMetadata = null;
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      const parts = body.split(`--${boundary}`);
      for (const part of parts) {
        if (part.includes('name="upfile"') && part.includes('filename=')) {
          const filenamePart = part.match(/filename="(.+?)"/);
          const contentTypePart = part.match(/Content-Type: (.+?)\r\n/);
          if (filenamePart && contentTypePart) {
            const filename = filenamePart[1];
            const type = contentTypePart[1];
            const contentStartIndex = part.indexOf('\r\n\r\n') + 4;
            const contentEndIndex = part.lastIndexOf('\r\n');
            const fileContent = part.substring(contentStartIndex, contentEndIndex);
            const size = Buffer.byteLength(fileContent);
            fileMetadata = {
              name: filename,
              type: type,
              size: size
            };
            break;
          }
        }
      }
      if (fileMetadata) {
        res.json(fileMetadata);
      } else {
        res.status(400).json({ error: 'No file found in the request' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error processing the file' });
    }
  });
});
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port);
});
