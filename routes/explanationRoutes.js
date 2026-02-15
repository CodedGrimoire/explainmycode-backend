const express = require('express');
const {
  generateExplanation,
  saveExplanation,
  getUserExplanations,
  deleteExplanation,
  updateExplanation,
  getExplanationById,
} = require('../controllers/explanationController');
const { generateTutorial } = require('../controllers/learnController');

const router = express.Router();

router.post('/generate', generateExplanation);
router.post('/save', saveExplanation);
router.get('/user', getUserExplanations);
router.get('/:id', getExplanationById);
router.delete('/:id', deleteExplanation);
router.put('/:id', updateExplanation);
router.post('/learn', generateTutorial);

module.exports = router;
