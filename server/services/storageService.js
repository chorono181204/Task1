const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
class StorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads');
    this.screenshotsDir = path.join(this.uploadsDir, 'screenshots');
    this.audioDir = path.join(this.uploadsDir, 'audio');
    this.resultsDir = path.join(this.uploadsDir, 'results');
  }
  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.resultsDir, { recursive: true });
    } catch (error) {
      throw error;
    }
  }

  async saveScreenshot(analysisId, screenshotBuffer) {
    try {
      await this.ensureDirectories();
      const filename = `${analysisId}.jpg`;
      const filepath = path.join(this.screenshotsDir, filename);
      
      await fs.writeFile(filepath, screenshotBuffer);
      
      return {
        filename,
        filepath,
        url: `/uploads/screenshots/${filename}`,
        size: screenshotBuffer.length
      };
    } catch (error) {
      throw new Error(`Failed to save screenshot: ${error.message}`);
    }
  }

  async saveAudio(analysisId, audioBuffer) {
    try {
      await this.ensureDirectories();
      const filename = `${analysisId}.wav`;
      const filepath = path.join(this.audioDir, filename);
      
      await fs.writeFile(filepath, audioBuffer);
      
      return {
        filename,
        filepath,
        url: `/uploads/audio/${filename}`,
        size: audioBuffer.length
      };
    } catch (error) {
      throw new Error(`Failed to save audio: ${error.message}`);
    }
  }

  async saveTranscript(analysisId, transcript) {
    try {
      await this.ensureDirectories();
      const filename = `${analysisId}.json`;
      const filepath = path.join(this.resultsDir, filename);
      
      const data = {
        id: analysisId,
        transcript: transcript,
        createdAt: new Date().toISOString(),
        metadata: {
          totalSentences: Array.isArray(transcript) ? transcript.length : 0,
          hasAIProbability: Array.isArray(transcript) ? transcript.some(s => s.ai_probability !== undefined) : false
        }
      };
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      return {
        filename,
        filepath,
        url: `/uploads/results/${filename}`,
        data
      };
    } catch (error) {
      throw new Error(`Failed to save transcript: ${error.message}`);
    }
  }

  async saveMetadata(analysisId, metadata) {
    try {
      await this.ensureDirectories();
      const filename = `${analysisId}_metadata.json`;
      const filepath = path.join(this.resultsDir, filename);
      
      const data = {
        id: analysisId,
        ...metadata,
        createdAt: new Date().toISOString()
      };
      
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      
      return {
        filename,
        filepath,
        url: `/uploads/results/${filename}`,
        data
      };
    } catch (error) {
      throw new Error(`Failed to save metadata: ${error.message}`);
    }
  }

  async getResult(analysisId) {
    try {
      const transcriptFile = path.join(this.resultsDir, `${analysisId}.json`);
      const metadataFile = path.join(this.resultsDir, `${analysisId}_metadata.json`);
      const screenshotFile = path.join(this.screenshotsDir, `${analysisId}.jpg`);
      const audioFile = path.join(this.audioDir, `${analysisId}.wav`);

      const result = {
        id: analysisId,
        exists: false,
        files: {},
        screenshot: null
      };

     
      try {
        const transcriptData = await fs.readFile(transcriptFile, 'utf8');
        result.transcript = JSON.parse(transcriptData);
        result.files.transcript = `/uploads/results/${analysisId}.json`;
        result.exists = true;
      } catch (error) {
      }

      
      try {
        const metadataData = await fs.readFile(metadataFile, 'utf8');
        result.metadata = JSON.parse(metadataData);
        result.files.metadata = `/uploads/results/${analysisId}_metadata.json`;
      } catch (error) {
      }

     
      try {
        await fs.access(screenshotFile);
        result.files.screenshot = `/uploads/screenshots/${analysisId}.jpg`;
        result.screenshot = `/uploads/screenshots/${analysisId}.jpg`;
      } catch (error) {
      }

   
      try {
        await fs.access(audioFile);
        result.files.audio = `/uploads/audio/${analysisId}.wav`;
      } catch (error) {
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get result: ${error.message}`);
    }
  }

  async deleteAnalysis(analysisId) {
    try {
      const files = [
        path.join(this.resultsDir, `${analysisId}.json`),
        path.join(this.resultsDir, `${analysisId}_metadata.json`),
        path.join(this.screenshotsDir, `${analysisId}.jpg`),
        path.join(this.audioDir, `${analysisId}.wav`)
      ];

      const deletedFiles = [];
      for (const file of files) {
        try {
          await fs.unlink(file);
          deletedFiles.push(path.basename(file));
        } catch (error) {
    
        }
      }

      return {
        success: true,
        deletedFiles,
        message: `Deleted ${deletedFiles.length} files for analysis ${analysisId}`
      };
    } catch (error) {
      throw new Error(`Failed to delete analysis: ${error.message}`);
    }
  }

  async listAnalyses() {
    try {
      await this.ensureDirectories();
      
      const files = await fs.readdir(this.resultsDir);
      const analyses = [];

      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('_metadata')) {
          const analysisId = file.replace('.json', '');
          try {
            const result = await this.getResult(analysisId);
            if (result.exists) {
              analyses.push({
                id: analysisId,
                createdAt: result.transcript?.createdAt || 'Unknown',
                totalSentences: result.transcript?.metadata?.totalSentences || 0,
                hasAIProbability: result.transcript?.metadata?.hasAIProbability || false,
                files: result.files
              });
            }
          } catch (error) {
          }
        }
      }

      return analyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Failed to list analyses: ${error.message}`);
    }
  }

  async getStorageInfo() {
    try {
      await this.ensureDirectories();
      
      const [screenshots, audio, results] = await Promise.all([
        fs.readdir(this.screenshotsDir).catch(() => []),
        fs.readdir(this.audioDir).catch(() => []),
        fs.readdir(this.resultsDir).catch(() => [])
      ]);

      return {
        screenshots: screenshots.length,
        audio: audio.length,
        results: results.filter(f => f.endsWith('.json') && !f.includes('_metadata')).length,
        directories: {
          uploads: this.uploadsDir,
          screenshots: this.screenshotsDir,
          audio: this.audioDir,
          results: this.resultsDir
        }
      };
    } catch (error) {
      throw new Error(`Failed to get storage info: ${error.message}`);
    }
  }
}

module.exports = new StorageService();
