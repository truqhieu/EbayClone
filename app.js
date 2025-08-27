// Backend Node.js Application
const express = require('express');
const os = require('os');
const cluster = require('cluster');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Server: ${SERVER_ID}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        server: SERVER_ID,
        hostname: os.hostname(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Main endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Load Balanced Server!',
        server: SERVER_ID,
        hostname: os.hostname(),
        pid: process.pid,
        timestamp: new Date().toISOString(),
        headers: req.headers
    });
});

// API endpoints
app.get('/api/users', (req, res) => {
    // Simulate some processing time
    setTimeout(() => {
        res.json({
            users: [
                { id: 1, name: 'John Doe', server: SERVER_ID },
                { id: 2, name: 'Jane Smith', server: SERVER_ID },
                { id: 3, name: 'Bob Johnson', server: SERVER_ID }
            ],
            server: SERVER_ID,
            timestamp: new Date().toISOString()
        });
    }, Math.random() * 100); // Random delay 0-100ms
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Simulate authentication processing
    setTimeout(() => {
        if (username && password) {
            res.json({
                success: true,
                message: 'Login successful',
                server: SERVER_ID,
                user: { username, id: Date.now() },
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Username and password required',
                server: SERVER_ID,
                timestamp: new Date().toISOString()
            });
        }
    }, Math.random() * 200 + 100); // Random delay 100-300ms
});

// CPU intensive endpoint to test load balancing under stress
app.get('/api/heavy', (req, res) => {
    const start = Date.now();
    
    // Simulate CPU intensive work
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
    }
    
    const duration = Date.now() - start;
    
    res.json({
        message: 'Heavy computation completed',
        server: SERVER_ID,
        hostname: os.hostname(),
        duration: `${duration}ms`,
        result: Math.floor(result),
        timestamp: new Date().toISOString()
    });
});

// Error simulation endpoint
app.get('/api/error', (req, res) => {
    const shouldError = Math.random() > 0.7; // 30% chance of error
    
    if (shouldError) {
        res.status(500).json({
            error: 'Simulated server error',
            server: SERVER_ID,
            timestamp: new Date().toISOString()
        });
    } else {
        res.json({
            message: 'Request processed successfully',
            server: SERVER_ID,
            timestamp: new Date().toISOString()
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log(`Server ${SERVER_ID} received SIGTERM, shutting down gracefully`);
    server.close(() => {
        console.log(`Server ${SERVER_ID} closed`);
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log(`Server ${SERVER_ID} received SIGINT, shutting down gracefully`);
    server.close(() => {
        console.log(`Server ${SERVER_ID} closed`);
        process.exit(0);
    });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${SERVER_ID} running on port ${PORT}`);
    console.log(`Hostname: ${os.hostname()}`);
    console.log(`PID: ${process.pid}`);
});

module.exports = app;