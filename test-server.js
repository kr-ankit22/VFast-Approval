import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World! This is a test server.');
});

app.listen(port, () => {
  console.log(`Test server is running at http://localhost:${port}`);
});