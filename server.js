// server.js
const express = require('express');
const path = require('path');

const app = express();

// Serve React static files from build
app.use(express.static(path.join(__dirname, 'build')));

// Catch all for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Use dynamic port for Azure
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
