const express = require('express');
const app = express();
const PORT = 8080;

// Add basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle CORS (if needed)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ...existing code...

// Improved server startup with error handling
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});