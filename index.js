import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// **Set your default Gemini model here**
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        res.json({ result: extractText(response) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});

function extractText(response) {
    try {
        const text =
            response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
            response?.candidates?.[0]?.content?.parts?.[0]?.text ??
            response?.response?.candidates?.[0]?.content?.text;
        return text ?? JSON.stringify(response, null, 2);
    } catch (error) {
        console.error('Error extracting text:', error);
        return text ?? JSON.stringify(response, null, 2);
    }
}