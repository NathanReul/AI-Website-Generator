const express = require("express");
const dotenv = require("dotenv");

dotenv.config();
    
const { InferenceClient  } = require("@huggingface/inference");
const client = new InferenceClient(process.env.HF_TOKEN);


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(async (req, res) => {
    
        try {
            const website = "https://toverland.com";
            const route = req.path;

            if (route === '/favicon.ico') {
                return res.send('x');
            }

            const content = "Give me the content for a fictional HTML page. Reply with ONLY the HTML content in plain text, do not put it in a code block or include commentary. The fictional page you should generate is on " + website + route + '. Include styling and navigation through <a> tags with a relative link, like <a href="/home">. Be creative and make it look like a real page, dont be afraid to return a lot of code. Feel free to use images, but use public cdns as the image URLs. Be realistic with the links, examples: a blog post: /blog/{post-title}. A user profile: /user/{id or username}. A settings page: /settings/{sub-settings}, etc.';
            console.log(content);

            const response = await client.chatCompletion({
                provider: "nebius",
                model: "microsoft/phi-4",
                messages: [
                    {
                        role: "user",
                        content: content
                    },
                ],
            });

            var responseContent = response.choices[0].message.content;

            if (responseContent.startsWith('```html')) {
                responseContent = responseContent.replace('```html', '').replace('```', '');
            }

            res.send(responseContent);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
