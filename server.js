const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// API Routes
app.use('/api', apiRoutes);

// Static frontend delivery
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback route to frontend SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Process safety guards
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    if (!res.headersSent) {
        res.status(500).json({
            status: 'error',
            message: err.message || 'Internal Server Error'
        });
    }
});

// Start HTTP server
const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`=======================================================`);
    console.log(`   INTELLISCAN - File Intelligence & Optimization     `);
    console.log(`=======================================================`);
    console.log(`   Server running at: http://localhost:${PORT}`);
    console.log(`   API endpoints:    http://localhost:${PORT}/api/health`);
    console.log(`   Static Web:       ${frontendPath}`);
    console.log(`=======================================================`);
});

module.exports = { app, server };
