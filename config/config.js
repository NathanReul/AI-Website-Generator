const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
    openRouterToken: process.env.OPENROUTER_TOKEN,
    sessionConfig: {
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    },
    openRouterConfig: {
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Title': 'AI Website Generator'
        }
    },
    defaultModel: 'openrouter/cypher-alpha:free',
    maxTokens: 20000,
    temperature: 0.7,
    customRoutes: ['/favicon.ico', '/reset', '/start', '/the-page-where-it-starts'],
    customStartsWithRoutes: ['/.well-known/']
}; 