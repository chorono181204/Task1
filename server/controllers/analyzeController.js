const analyzeService = require('../services/analyzeService');

class AnalyzeController {
  // POST /analyze - Start analysis
  async analyzeYouTubeVideo(req, res) {
    try {
      const { youtubeUrl } = req.body;
      
      // Validate input
      if (!youtubeUrl) {
        return res.status(400).json({
          success: false,
          error: 'YouTube URL is required'
        });
      }
      
      // Validate YouTube URL format
      if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid YouTube URL format'
        });
      }
      

      
      // Start analysis
      const result = await analyzeService.analyzeYouTubeVideo(youtubeUrl);
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Analysis completed successfully',
        analysisId: result.analysisId,
        youtubeUrl: result.youtubeUrl,
        videoInfo: result.videoInfo,
        summary: result.summary,
        screenshot: result.screenshot, // Thêm screenshot URL
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
  
  // GET /analyze/status/:id - Check analysis status
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
  
  // GET /analyze/list - List all analyses
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
  
  // DELETE /analyze/:id - Delete analysis
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
  
  // GET /analyze/health - System health check
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
