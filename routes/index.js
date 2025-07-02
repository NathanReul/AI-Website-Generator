const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const modelsService = require('../services/modelsService');
const openRouterService = require('../services/openRouterService');
const config = require('../config/config');

const router = express.Router();

/**
 * Set up Socket.IO handlers for content generation
 */
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        
        socket.on('generate-content', async (data) => {
            const { sessionId, route } = data;
            
            try {
                // Get session data from memory (in production, use Redis or similar)
                const sessionData = global.activeSessions?.[sessionId];
                
                if (!sessionData) {
                    socket.emit('generation-error', {
                        sessionId,
                        error: 'Session not found. Please start over.'
                    });
                    return;
                }
                
                const { website, model, prompt } = sessionData;
                
                socket.emit('generation-status', {
                    sessionId,
                    status: 'Connecting to AI model...'
                });
                
                // Validate model and use fallback if needed
                let finalModel = model;
                if (!modelsService.validateModel(model)) {
                    finalModel = modelsService.getFallbackModel();
                }
                
                socket.emit('generation-status', {
                    sessionId,
                    status: 'Generating content...'
                });
                
                const url = website + route;
                const finalPrompt = openRouterService.generateWebsitePrompt(url, prompt);
                
                const content = await openRouterService.generateContent(finalModel, finalPrompt);
                
                socket.emit('content-ready', {
                    sessionId,
                    content
                });
                
            } catch (error) {
                console.error('Content generation error:', error);
                
                let errorMessage = 'Sorry, something went wrong.';
                if (error.response?.data?.error) {
                    errorMessage = `OpenRouter API Error: ${error.response.data.error.message}.`;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                socket.emit('generation-error', {
                    sessionId,
                    error: errorMessage
                });
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
}

// Initialize global sessions store (in production, use Redis or similar)
global.activeSessions = global.activeSessions || {};

/**
 * Render the main page with model selection
 */
router.get('/the-page-where-it-starts', (req, res) => {
    const templatePath = path.join(__dirname, '../templates', 'index.html');
    
    fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading template:', err);
            return res.status(500).send('Error loading template');
        }

        const models = modelsService.getAllModels();
        data = data.replace('{models}', JSON.stringify(models));
        res.send(data);
    });
});

/**
 * Reset and update models from OpenRouter API
 */
router.get('/reset', async (req, res) => {
    res.send('Resetting...');

    try {
        await modelsService.fetchAndUpdateModels();
    } catch (error) {
        console.error('Error during reset:', error);
    }
});

/**
 * Start a new session with website, model, prompt, and optional path parameters
 */
router.get('/start', (req, res) => {
    req.session.website = req.query.website;
    req.session.model = req.query.model;
    req.session.prompt = req.query.prompt;
    req.session.startingPath = req.query.path || '';
    
    // Generate a unique session ID for Socket.IO communication
    const sessionId = crypto.randomUUID();
    req.session.socketSessionId = sessionId;
    
    // Store session data in global store for Socket.IO access
    global.activeSessions[sessionId] = {
        website: req.query.website,
        model: req.query.model,
        prompt: req.query.prompt,
        startingPath: req.query.path || ''
    };

    // Redirect to the starting path if provided, otherwise to root
    const redirectPath = req.query.path || '/';
    res.redirect(redirectPath);
});

/**
 * Handle dynamic website content generation with loading page
 */
router.use(async (req, res) => {
    try {
        if (!req.session.website || !req.session.model || !req.session.socketSessionId) {
            return res.redirect('/the-page-where-it-starts');
        }

        const route = req.path;
        
        // If this is the first visit and a starting path was specified,
        // ensure we're on the correct path
        if (req.session.startingPath && req.session.startingPath !== route && !req.session.pathVisited) {
            req.session.pathVisited = true;
            return res.redirect(req.session.startingPath);
        }

        // Skip custom routes
        if (config.customRoutes.includes(route) || 
            config.customStartsWithRoutes.some(customRoute => route.startsWith(customRoute))) {
            return;
        }

        // Set up Socket.IO handlers if not already done
        const io = req.app.get('io');
        if (io && !io.setupComplete) {
            setupSocketHandlers(io);
            io.setupComplete = true;
        }

        // Serve the loading page with session information
        const loadingTemplatePath = path.join(__dirname, '../templates', 'loading.html');
        
        fs.readFile(loadingTemplatePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading loading template:', err);
                return res.status(500).send('Error loading template');
            }

            // Replace placeholders with actual values
            data = data.replace('{website}', req.session.website);
            data = data.replace('{route}', route);
            data = data.replace('{model}', req.session.model);
            data = data.replace(/{sessionId}/g, req.session.socketSessionId);
            
            res.send(data);
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(`Sorry, something went wrong. Click <a href="/the-page-where-it-starts">here</a> to try again.`);
    }
});

module.exports = router; 