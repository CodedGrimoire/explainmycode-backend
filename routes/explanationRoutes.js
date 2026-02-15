const express = require('express');
const {
  generateExplanation,
  saveExplanation,
  getUserExplanations,
  deleteExplanation,
  updateExplanation,
  getExplanationById,
} = require('../controllers/explanationController');
const { generateTutorial, saveTutorial, getUserTutorials, getTutorialById } = require('../controllers/learnController');

const router = express.Router();

router.post('/generate', generateExplanation);
router.post('/save', saveExplanation);
router.get('/user', getUserExplanations);
router.get('/:id', getExplanationById);
router.delete('/:id', deleteExplanation);
router.put('/:id', updateExplanation);
router.post('/learn', generateTutorial);
router.post('/learn/save', saveTutorial);
router.get('/learn/user', getUserTutorials);
router.get('/learn/:id', getTutorialById);

module.exports = router;
