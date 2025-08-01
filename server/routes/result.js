const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
router.get('/:id', resultController.getAnalysisResult);
router.get('/:id/transcript', resultController.getTranscript);
router.get('/:id/screenshot', resultController.getScreenshot);
router.get('/:id/metadata', resultController.getMetadata);
router.get('/:id/summary', resultController.getSummary);
module.exports = router;
