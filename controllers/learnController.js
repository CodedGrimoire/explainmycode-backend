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
      '  "useCases": ["when to use it", "another good use"],',
      '  "complexity": { "time": "O(...)", "space": "O(...)" },',
      '  "tips": ["practical tip or pitfall", "one more improvement"],',
      '  "relatedConcepts": ["related topic", "another"]',
      '}',
      'Rules: keep strings concise; no code or pseudocode fields are required.',
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

      let cleanText = stripped.slice(jsonStart, jsonEnd);
      cleanText = cleanText.replace(/\n\s*\.replace\([^)]*\)/g, '');

      const parsed = JSON.parse(cleanText);

      // Ensure complexity exists even if model omits it
      if (!parsed.complexity) {
        parsed.complexity = { time: parsed.timeComplexity || '—', space: parsed.spaceComplexity || '—' };
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

exports.getUserTutorials = async (req, res, next) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ message: 'uid is required' });

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tutorials = await Tutorial.find({ userId: user._id }).sort({ createdAt: -1 });
    return res.json(tutorials);
  } catch (error) {
    next(error);
  }
};

exports.getTutorialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const tutorial = await Tutorial.findById(id);
    if (!tutorial) return res.status(404).json({ message: 'Tutorial not found' });

    return res.json(tutorial);
  } catch (error) {
    next(error);
  }
};

exports.deleteTutorial = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const deleted = await Tutorial.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Tutorial not found' });

    return res.json({ message: 'Tutorial deleted' });
  } catch (error) {
    next(error);
  }
};
