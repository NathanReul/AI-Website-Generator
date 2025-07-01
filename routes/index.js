const express = require('express');
const path = require('path');
const fs = require('fs');
const modelsService = require('../services/modelsService');
const openRouterService = require('../services/openRouterService');
const config = require('../config/config');

const router = express.Router();

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
 * Start a new session with website, model, and prompt parameters
 */
router.get('/start', (req, res) => {
    req.session.website = req.query.website;
    req.session.model = req.query.model;
    req.session.prompt = req.query.prompt;

    res.redirect('/');
});

/**
 * Handle dynamic website content generation
 */
router.use(async (req, res) => {
    try {
        if (!req.session.website || !req.session.model) {
            return res.redirect('/the-page-where-it-starts');
        }

        const model = req.session.model || config.defaultModel;
        const website = req.session.website;
        const route = req.path;
        const customPrompt = req.session.prompt;

        // Validate model and use fallback if needed
        if (!modelsService.validateModel(model)) {
            const fallbackModel = modelsService.getFallbackModel();
            req.session.model = fallbackModel;
        }

        // Skip custom routes
        if (config.customRoutes.includes(route) || 
            config.customStartsWithRoutes.some(customRoute => route.startsWith(customRoute))) {
            return;
        }

        const url = website + route;
        const prompt = openRouterService.generateWebsitePrompt(url, customPrompt);
        
        const content = await openRouterService.generateContent(req.session.model, prompt);
        res.send(content);

    } catch (error) {
        console.error('Error:', error);
        
        let errorMessage = 'Sorry, something went wrong.';
        if (error.response?.data?.error) {
            errorMessage = `OpenRouter API Error: ${error.response.data.error.message}.`;
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).send(`${errorMessage} Click <a href="/the-page-where-it-starts">here</a> to try again.`);
    }
});

module.exports = router; 