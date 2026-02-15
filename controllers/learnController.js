const mongoose = require('mongoose');
const User = require('../models/User');
const Tutorial = require('../models/Tutorial');

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/**
 * Generate an algorithm or data structure tutorial using Groq.
 * Returns structured JSON that the frontend can render without extra parsing.
 */
exports.generateTutorial = async (req, res, next) => {
  try {
    const { topic, level = 'beginner', category = 'algorithm', language = 'javascript' } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: 'topic is required' });
    }

    const prompt = [
      `Create a compact study card for the ${category} "${topic}" tailored for ${level} learners.`,
      'Return ONLY valid JSON (no markdown/backticks) matching this shape:',
      '{',
      '  "title": "Readable title for the concept",',
      '  "level": "beginner | medium | hard",',
      '  "category": "algorithm | data structure",',
      '  "theory": "3-5 sentences explaining the intuition and when it matters",',
      '  "implementationSteps": ["step 1", "step 2", "step 3"],',
      '  "pseudocodeB64": "base64-encoded pseudocode text",',
      '  "codeExample": { "language": "preferred code language", "codeB64": "base64-encoded code snippet" },',
      '  "useCases": ["when to use it", "another good use"],',
      '  "complexity": { "time": "O(...)", "space": "O(...)" },',
      '  "tips": ["practical tip or pitfall", "one more improvement"],',
      '  "relatedConcepts": ["related topic", "another"]',
      '}',
      'Rules: all free-text (theory, pseudocodeB64 decoded, codeExample.codeB64 decoded) must be concise; codeExample under 30 lines.',
      'Do NOT include raw newlines in JSON strings; encode multi-line text in base64 fields only.',
      `Preferred language for codeExample: ${language}.`,
    ].join('\n');

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ message: 'GROQ request failed', detail });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ message: 'Invalid response from GROQ' });
    }

    try {
      const stripped = content.replace(/```json|```/gi, '').trim();
      const jsonStart = stripped.indexOf('{');
      const jsonEnd = stripped.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        return res.status(502).json({ message: 'AI returned no JSON object', raw: content });
      }

      const cleanText = stripped.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(cleanText);

      // decode base64 fields if present
      if (parsed?.pseudocodeB64) {
        parsed.pseudocode = Buffer.from(parsed.pseudocodeB64, 'base64').toString('utf8');
      }
      if (parsed?.codeExample?.codeB64) {
        parsed.codeExample.code = Buffer.from(parsed.codeExample.codeB64, 'base64').toString('utf8');
      }

      return res.json(parsed);
    } catch (err) {
      return res.status(500).json({ message: 'AI returned invalid JSON', raw: content });
    }
  } catch (error) {
    next(error);
  }
};

exports.saveTutorial = async (req, res, next) => {
  try {
    const { uid, topic, level, category, language, tutorial } = req.body || {};

    if (!uid) return res.status(400).json({ message: 'uid is required' });
    if (!tutorial) return res.status(400).json({ message: 'tutorial payload is required' });

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const saved = await Tutorial.create({
      userId: user._id,
      topic,
      level,
      category,
      language,
      tutorial,
    });

    return res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};
