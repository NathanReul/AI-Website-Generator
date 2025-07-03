const axios = require('axios');
const config = require('../config/config');

class OpenRouterService {
    constructor() {
        this.client = axios.create({
            baseURL: config.openRouterConfig.baseURL,
            headers: config.openRouterConfig.headers
        });
    }

    /**
     * Generate content using OpenRouter API
     * @param {string} model - The model ID to use
     * @param {string} prompt - The prompt to send to the model
     * @returns {Promise<string>} The generated content
     */
    async generateContent(model, prompt) {
        try {
            //Hello!
            const response = await this.client.post('/chat/completions', {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature,
                stream: false
            });

            if (response.data.error) {
                throw new Error(`OpenRouter API Error: ${response.data.error.message}`);
            }

            let content = response.data.choices[0].message.content;

            // Clean up the response content
            content = this.cleanResponseContent(content);

            return content;
        } catch (error) {
            console.error('OpenRouter API Error:', error);
            throw error;
        }
    }

    /**
     * Clean up the response content by removing code blocks and thinking tags
     * @param {string} content - The raw response content
     * @returns {string} The cleaned content
     */
    cleanResponseContent(content) {
        // Remove HTML code blocks
        if (content.startsWith('```html')) {
            content = content.replace('```html', '').replace('```', '');
        }

        // Remove DeepSeek thinking tags
        content = content.replace(/<think>.*?<\/think>/gs, '');

        return content;
    }

    /**
     * Generate a prompt for website content
     * @param {string} url - The URL to generate content for
     * @param {string} customPrompt - Optional custom prompt template
     * @returns {string} The formatted prompt
     */
    generateWebsitePrompt(url, customPrompt = null) {
        if (customPrompt) {
            return customPrompt.replace(/{url}/g, url);
        }

        return `Give me the content for a fictional HTML page. Reply with ONLY the HTML content in plain text, do not put it in a code block or include commentary. The fictional page you should generate is on ${url}. Include styling and navigation through <a> tags with a relative link, like <a href="/home">. Include a lot of <a> tags. Be creative and make it look like a real page, dont be afraid to return a lot of code. Feel free to use images, but use public cdns as the image URLs. Be realistic with the links, examples: a blog post: /blog/{post-title}. A user profile: /user/{id or username}. A settings page: /settings/{sub-settings}, etc.`;
    }
}

module.exports = new OpenRouterService(); 