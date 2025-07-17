// ~/freshzincs/index.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// Serve everything in /public as static assets
app.use(express.static(path.join(__dirname, 'public')));

// If you want clean URLs, you can map e.g. `/about` → public/about.html
app.get('/home',      (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public/about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public/contact.html')));

// Start listening
app.listen(PORT, () => console.log(`🌊 FreshZincs listening on port ${PORT}`));
