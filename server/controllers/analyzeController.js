const analyzeService = require('../services/analyzeService');

class AnalyzeController {

  async analyzeYouTubeVideo(req, res) {
    try {
     
      const { youtubeUrl } = req.body;
      
    
      if (!youtubeUrl) {
        return res.status(400).json({
          success: false,
          error: 'YouTube URL is required',
          receivedBody: req.body
        });
      }
      
     
      if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid YouTube URL format'
        });
      }
      

      
     
      const result = await analyzeService.analyzeYouTubeVideo(youtubeUrl);
      
     
      res.status(200).json({
        success: true,
        message: 'Analysis completed successfully',
        analysisId: result.analysisId,
        youtubeUrl: result.youtubeUrl,
        videoInfo: result.videoInfo,
        summary: result.summary,
        screenshot: result.screenshot, 
        resultUrl: `/result/${result.analysisId}`
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Analysis failed. Please try again.'
      });
    }
  }
  

  async getAnalysisStatus(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const status = await analyzeService.getAnalysisStatus(id);
      
      res.status(200).json({
        success: true,
        status: status
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async listAnalyses(req, res) {
    try {
      const analyses = await analyzeService.listAnalyses();
      
      res.status(200).json({
        success: true,
        analyses: analyses,
        count: analyses.length
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async deleteAnalysis(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Analysis ID is required'
        });
      }
      
      const result = await analyzeService.deleteAnalysis(id);
      
      res.status(200).json({
        success: result.success,
        message: result.success ? 'Analysis deleted successfully' : 'Failed to delete analysis'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  

  async getSystemHealth(req, res) {
    try {
      const health = await analyzeService.getSystemHealth();
      
      res.status(200).json({
        success: true,
        health: health
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AnalyzeController();
