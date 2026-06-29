const express = require('express');
const router = express.Router();
const axios = require('axios');

// Free models in priority order — tries each until one succeeds
const FREE_MODELS = [
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemma-2-9b-it:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
];

const callOpenRouter = async (messages) => {
    let lastError = null;
    for (const model of FREE_MODELS) {
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                { model, messages },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000',
                        'X-Title': 'QA Platform'
                    },
                    timeout: 30000
                }
            );
            const content = response.data?.choices?.[0]?.message?.content;
            if (content) {
                console.log(`[AI] Success with model: ${model}`);
                return content;
            }
        } catch (err) {
            const status = err.response?.status;
            console.warn(`[AI] Model ${model} failed (${status}): ${err.response?.data?.error?.message || err.message}`);
            lastError = err;
            // Fail fast ONLY on 401 Unauthorized (bad API key)
            if (status === 401) {
                break;
            }
        }
    }
    throw lastError || new Error('All AI models exhausted');
};

// ── Test Case Generation ─────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
        const fullPrompt = `You are an expert QA Automation Engineer.
Generate comprehensive test cases (Positive and Negative) for:
"${prompt}"

Return ONLY a raw JSON array. No markdown, no explanations:
[{"title":"...","description":"...","preconditions":"...","steps":"Step 1:...","expected_result":"...","priority":"High"}]`;

        let content = await callOpenRouter([{ role: 'user', content: fullPrompt }]);
        content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        // Extract array if extra text
        const arrMatch = content.match(/\[[\s\S]*\]/);
        if (arrMatch) content = arrMatch[0];
        res.json({ result: content });
    } catch (err) {
        console.error('AI Generation Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to generate test cases', details: err.message });
    }
});

// ── Generic AI Chat (BDD Studio, Defect Triage, etc.) ────────────────────────
router.post('/chat', async (req, res) => {
    const { prompt, systemPrompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
        const messages = [
            {
                role: 'system',
                content: systemPrompt || 'You are a JSON-only API. Return only valid JSON. No markdown, no comments, no extra text.'
            },
            { role: 'user', content: prompt }
        ];

        let content = await callOpenRouter(messages);
        content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        res.json({ response: content, reply: content });
    } catch (err) {
        console.error('AI Chat Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'AI request failed', details: err.message });
    }
});

module.exports = router;
module.exports.callOpenRouter = callOpenRouter;
