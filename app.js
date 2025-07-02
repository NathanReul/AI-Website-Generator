const express = require('express');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config/config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

/**
 * Initialize Express application with Socket.IO
 */
function createApp() {
    const app = express();
    const server = createServer(app);
    const io = new Server(server);

    // Middleware
    app.use(express.json());
    app.use(session(config.sessionConfig));

    // Store io instance in app for use in routes
    app.set('io', io);

    // Routes
    app.use('/', routes);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return { app, server, io };
}

/**
 * Start the server
 */
function startServer() {
    const { app, server, io } = createApp();
    
    server.listen(config.port, () => {
        console.log(`AI Website Generator running on port ${config.port}`);
        console.log(`Visit http://localhost:${config.port}/the-page-where-it-starts to get started`);
    });
    
    return { app, server, io };
}

// Start the application
if (require.main === module) {
    startServer();
}

module.exports = { createApp, startServer }; 