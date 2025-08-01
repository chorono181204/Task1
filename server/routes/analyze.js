const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
router.post('/', analyzeController.analyzeYouTubeVideo);
router.get('/status/:id', analyzeController.getAnalysisStatus);
router.get('/list', analyzeController.listAnalyses);
router.delete('/:id', analyzeController.deleteAnalysis);
router.get('/health', analyzeController.getSystemHealth);
module.exports = router;
