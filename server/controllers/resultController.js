const analyzeService = require('../services/analyzeService');

class ResultController {

  async getAnalysisResult(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.getAnalysisResult(id);
      
      
      const acceptHeader = req.headers.accept || '';
      const wantsJson = acceptHeader.includes('application/json') || req.query.format === 'json';
      
      if (wantsJson) {
        
        res.status(200).json({
          success: true,
          analysisId: result.analysisId,
          transcript: result.transcript,
          screenshot: result.files?.screenshot || result.screenshot,
          metadata: result.metadata
        });
      } else {
        
        res.render('result', {
          title: 'Analysis Result',
          analysisId: result.analysisId,
          transcript: result.transcript,
          screenshot: result.files?.screenshot || result.screenshot,
          metadata: result.metadata
        });
      }
      
    } catch (error) {
      if (error.message === 'Analysis not found') {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found',
          message: 'The requested analysis could not be found.'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async getTranscript(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.getAnalysisResult(id);
      
      res.status(200).json({
        success: true,
        analysisId: result.analysisId,
        transcript: result.transcript
      });
      
    } catch (error) {
      if (error.message === 'Analysis not found') {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async getScreenshot(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.getAnalysisResult(id);
      
      if (!result.screenshot) {
        return res.status(404).json({
          success: false,
          error: 'Screenshot not found'
        });
      }
      
      
      res.redirect(result.screenshot);
      
    } catch (error) {
      if (error.message === 'Analysis not found') {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async getMetadata(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.getAnalysisResult(id);
      
      res.status(200).json({
        success: true,
        analysisId: result.analysisId,
        metadata: result.metadata
      });
      
    } catch (error) {
      if (error.message === 'Analysis not found') {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async getSummary(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.getAnalysisResult(id);
      
      
      const summary = {
        analysisId: result.analysisId,
        videoInfo: result.metadata?.videoInfo,
        totalSentences: result.transcript?.data?.transcript?.length || 0,
        averageAIProbability: result.metadata?.aiAnalysis?.averageAIProbability,
        aiGeneratedSentences: result.metadata?.summary?.aiGeneratedSentences || 0,
        humanGeneratedSentences: result.metadata?.summary?.humanGeneratedSentences || 0,
        createdAt: result.metadata?.createdAt,
        processedAt: result.metadata?.processedAt
      };
      
      res.status(200).json({
        success: true,
        summary: summary
      });
      
    } catch (error) {
      if (error.message === 'Analysis not found') {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ResultController();

