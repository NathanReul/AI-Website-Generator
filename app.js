const express = require('express');
const session = require('express-session');
const config = require('./config/config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

/**
 * Initialize Express application
 */
function createApp() {
    const app = express();

    // Middleware
    app.use(express.json());
    app.use(session(config.sessionConfig));

    // Routes
    app.use('/', routes);

    // Error handling middleware (must be last)
    app.use(errorHandler);

    return app;
}

/**
 * Start the server
 */
function startServer() {
    const app = createApp();
    
    app.listen(config.port, () => {
        console.log(`AI Website Generator running on port ${config.port}`);
        console.log(`Visit http://localhost:${config.port}/the-page-where-it-starts to get started`);
    });
}

// Start the application
if (require.main === module) {
    startServer();
}

module.exports = { createApp, startServer }; 