const express = require('express');
const app = express();

// Add proper UTF-8 encoding configuration
app.use((req, res, next) => {
  res.charset = 'UTF-8';
  res.contentType('text/html; charset=UTF-8');
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});