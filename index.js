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
        }));
        fs.writeFileSync('./templates/models.json', JSON.stringify(models, null, 2));
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

            const model = req.session.model;
            const website = req.session.website;
            const route = req.path;
            const customPrompt = req.session.prompt;

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

            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: content
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_TOKEN}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'AI Website Generator'
                }
            }).catch(error => {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            });

            var responseContent = response.data.choices[0].message.content;

            if (responseContent.startsWith('```html')) {
                responseContent = responseContent.replace('```html', '').replace('```', '');
            }

            // Remove DeepSeek thinking tags
            responseContent = responseContent.replace(/<think>.*?<\/think>/gs, '');

            res.send(responseContent);
        } catch (error) {
            console.error('Error:', error);
            res.send('Sorry, something went wrong. Click <a href="/the-page-where-it-starts">here</a> to try again.');
        }
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
