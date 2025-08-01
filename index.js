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

// 1.Generate From Text
app.post('/generate-text', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });
        res.json({ result: extractText(resp) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.Generate From Image
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageBase64 = req.file ? req.file.buffer.toString('base64') : null;
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt },
                { inlineData: { mimeType: req.file.mimetype, data: imageBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3.Generate From Document
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body;
        const documentBase64 = req.file ? req.file.buffer.toString('base64') : null;
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || "Ringkas dokumen berikut:" },
                { inlineData: { mimeType: req.file.mimetype, data: documentBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Generate From Audio
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    try {
        const {prompt} = req.body;
        const audioBase64 = req.file ? req.file.buffer.toString('base64') : null;
        const resp = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt || "Transkrip audio berikut:" },
                { inlineData: { mimeType: req.file.mimetype, data: audioBase64 } }
            ]
        });
        res.json({ result: extractText(resp) });
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