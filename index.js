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
            const website = "https://fishmarket.com";
            const route = req.path;
            const content = "Give me the content for a fictional HTML page. Reply with ONLY the HTML content in plain text, do not put it in a code block or include commentary. The fictional page you should generate is on https://fishmarket.com/ " + route + '. Include styling and navigation through <a> tags with a relative link in the href attribute.';
            
                const response = await client.chatCompletion({
                    provider: "nebius",
                    model: "google/gemma-2-2b-it",
                    messages: [
                        {
                            role: "user",
                            content: content
                        },
                    ],
                });
            res.send(response.choices[0].message.content);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
