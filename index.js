import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.all('*', async (req, res) => {
    try {
        const route = req.path;
        const client = new OpenAI();
        
        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: "Give me the content for a fictional HTML page. Reply with ONLY the HTML content in plain text, do not put it in a code block or include commentary. The fictional page you should generate is on https://localhost:3000/ " + route
                }
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
