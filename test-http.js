console.log("Starting the basic HTTP server script...");

import http from 'http';

console.log("HTTP module loaded.");

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from the basic HTTP server!\n');
});

console.log("Server created. Attempting to listen on port 3001...");

server.listen(3001, 'localhost', () => {
  console.log('Basic HTTP server running at http://localhost:3001/');
});