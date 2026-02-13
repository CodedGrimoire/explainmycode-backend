const User = require('../models/User');
const Explanation = require('../models/Explanation');

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

exports.generateExplanation = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'code is required' });
    }

    const prompt = [
      'Explain the following code in a structured technical format.',
      '',
      `Code:\n${code}`,
      '',
      `Language:\n${language || 'unspecified'}`,
      '',
      'Return ONLY valid JSON in the following structure:',
      '{',
      '  "summary": "2-4 line explanation of what the code does",',
      '  "timeComplexity": "Big-O time complexity with reason",',
      '  "spaceComplexity": "Big-O space complexity with reason",',
      '  "bugs": [',
      '    "possible bug 1",',
      '    "possible bug 2"',
      '  ],',
      '  "beginnerExplanation": "Simple explanation a beginner can understand",',
      '  "optimizedVersion": "Improved or more efficient version of the code (same language)",',
      '  "keyConcepts": [',
      '    "concept 1",',
      '    "concept 2",',
      '    "concept 3"',
      '  ]',
      '}',
      '',
      'STRICT RULES:',
      '- Return ONLY JSON',
      '- No markdown',
      '- No numbering',
      '- No explanation outside JSON',
      '- No backticks',
      '- No headings',
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
      const errorText = await response.text();
      return res.status(502).json({ message: 'GROQ request failed', detail: errorText });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ message: 'Invalid response from GROQ' });
    }

    let parsed;
    try {
      const stripped = content.replace(/```json|```/gi, '').trim();
      const jsonStart = stripped.indexOf('{');
      const jsonEnd = stripped.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        return res.status(502).json({ message: 'AI returned no JSON object', raw: content });
      }

      const cleanText = stripped.slice(jsonStart, jsonEnd);
      parsed = JSON.parse(cleanText);
    } catch (err) {
      return res.status(500).json({
        message: 'AI returned invalid JSON',
        raw: content,
      });
    }

    res.json(parsed);
  } catch (error) {
    next(error);
  }
};

exports.saveExplanation = async (req, res, next) => {
  try {
    const { uid, code, explanation, language, complexity } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'uid is required' });
    }

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saved = await Explanation.create({
      userId: user._id,
      code,
      explanation,
      language,
      complexity,
    });

    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

exports.getUserExplanations = async (req, res, next) => {
  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({ message: 'uid is required' });
    }

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const explanations = await Explanation.find({ userId: user._id })
      .sort({ createdAt: -1 });

    res.json(explanations);
  } catch (error) {
    next(error);
  }
};

exports.deleteExplanation = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Explanation.findByIdAndDelete(id);

    res.json({ message: 'Explanation deleted' });
  } catch (error) {
    next(error);
  }
};

exports.updateExplanation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { explanation, complexity, language } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid explanation id' });
    }

    const updated = await Explanation.findByIdAndUpdate(
      id,
      { explanation, complexity, language },
      { returnDocument: 'after' }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Explanation not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
