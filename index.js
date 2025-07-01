const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const session = require("express-session");

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;
var models = JSON.parse(fs.readFileSync('./templates/models.json', 'utf8'));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.get('/the-page-where-it-starts', (req, res) => {
    const templatePath = path.join(__dirname, 'templates', 'index.html');
    fs.readFile(templatePath, 'utf8', (err, data) => {
        const models = JSON.parse(fs.readFileSync('./templates/models.json', 'utf8'));
        data = data.replace('{models}', JSON.stringify(models));
        if (err) {
            console.error('Error reading template:', err);
            res.status(500).send('Error loading template');
            return;
        }
        res.send(data);
    });
});

app.get('/reset', (req, res) => {
    res.send('Resetting...');

    axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_TOKEN}`,
            'Content-Type': 'application/json'
        }
    }).then(result => {
        models = result.data.data.map(model => ({
            id: model.id,
            name: model.name,
            description: model.description,
            context_length: model.context_length,
            pricing: model.pricing
        })).sort((a, b) => {
            if (a.id.includes(':free') && !b.id.includes(':free')) return -1;
            if (!a.id.includes(':free') && b.id.includes(':free')) return 1;
            return a.id.localeCompare(b.id);
        });
        fs.writeFileSync('./templates/models.json', JSON.stringify(models, null, 2));
        console.log(`Updated models.json with ${models.length} models`);
    }).catch(error => {
        console.error('Error fetching models:', error.response?.data || error.message);
    });
});

app.get('/start', (req, res) => {
    req.session.website = req.query.website;
    req.session.model = req.query.model;
    req.session.prompt = req.query.prompt;

    res.redirect('/');
});

app.use(async (req, res) => {
        try {
            if (!req.session.website || !req.session.model) {
                return res.redirect('/the-page-where-it-starts');
            }

            const model = req.session.model || 'openrouter/cypher-alpha:free';
            const website = req.session.website;
            const route = req.path;
            const customPrompt = req.session.prompt;

            console.log('Using model:', model);

            // Validate that the model exists in our list
            const availableModels = JSON.parse(fs.readFileSync('./templates/models.json', 'utf8'));
            const modelExists = availableModels.some(m => m.id === model);
            if (!modelExists) {
                console.log('Model not found, using fallback:', model);
                // Use a fallback free model
                const fallbackModel = availableModels.find(m => m.id.includes(':free'))?.id || 'openrouter/cypher-alpha:free';
                req.session.model = fallbackModel;
                console.log('Using fallback model:', fallbackModel);
            }

            const customRoutes = ['/favicon.ico', '/reset', '/start', '/the-page-where-it-starts'];
            if (customRoutes.includes(route)) {
                return;
            }

            const customStartsWithRoutes = ['/.well-known/'];
            if (customStartsWithRoutes.some(customRoute => route.startsWith(customRoute))) {
                return;
            }

            const url = website + route;
            const content = customPrompt ? customPrompt.replace(/{url}/g, url) : "Give me the content for a fictional HTML page. Reply with ONLY the HTML content in plain text, do not put it in a code block or include commentary. The fictional page you should generate is on " + url + '. Include styling and navigation through <a> tags with a relative link, like <a href="/home">. Include a lot of <a> tags. Be creative and make it look like a real page, dont be afraid to return a lot of code. Feel free to use images, but use public cdns as the image URLs. Be realistic with the links, examples: a blog post: /blog/{post-title}. A user profile: /user/{id or username}. A settings page: /settings/{sub-settings}, etc.';

            console.log('Making API request to OpenRouter with model:', model);
            
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: content
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_TOKEN}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'AI Website Generator'
                }
            });

            if (response.data.error) {
                console.error('OpenRouter API Error:', response.data.error);
                return res.status(500).send(`OpenRouter API Error: ${response.data.error.message}. Click <a href="/the-page-where-it-starts">here</a> to try again.`);
            }

            var responseContent = response.data.choices[0].message.content;

            if (responseContent.startsWith('```html')) {
                responseContent = responseContent.replace('```html', '').replace('```', '');
            }

            // Remove DeepSeek thinking tags
            responseContent = responseContent.replace(/<think>.*?<\/think>/gs, '');

            res.send(responseContent);
        } catch (error) {
            console.error('Error:', error);
            if (error.response && error.response.data && error.response.data.error) {
                res.status(500).send(`OpenRouter API Error: ${error.response.data.error.message}. Click <a href="/the-page-where-it-starts">here</a> to try again.`);
            } else {
                res.status(500).send('Sorry, something went wrong. Click <a href="/the-page-where-it-starts">here</a> to try again.');
            }
        }
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
