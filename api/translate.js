/**
 * Backend server for Chinese → English translation using DeepSeek API.
 * API key is loaded from .env and never exposed to the frontend.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const TRANSLATION_SYSTEM_PROMPT = `你是一个专业的出海翻译助手，请把中文翻译成地道、适合海外市场的英语。只输出翻译结果，不要解释或添加额外内容。`;

if (!DEEPSEEK_API_KEY) {
  console.warn('Warning: DEEPSEEK_API_KEY is not set in .env. Translation will fail.');
}

app.post('/api/translate', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid text' });
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return res.status(400).json({ error: 'Text is empty' });
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'Translation service is not configured. Please set DEEPSEEK_API_KEY in .env.' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: TRANSLATION_SYSTEM_PROMPT },
          { role: 'user', content: trimmed },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || data.error?.code || JSON.stringify(data);
      return res.status(response.status).json({ error: `DeepSeek API error: ${errMsg}` });
    }

    const translated = data.choices?.[0]?.message?.content?.trim();
    if (!translated) {
      return res.status(500).json({ error: 'No translation in API response' });
    }

    res.json({ translation: translated });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({
      error: err.message || 'Translation failed. Please try again.',
    });
  }
});
module.exports = app;
