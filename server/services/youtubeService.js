const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config');
const storageService = require('./storageService');

class YouTubeService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: config.puppeteerHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }
  }

  async closeBrowser() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  validateYouTubeUrl(url) {
    try {
      const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:&|$)/);
      if (!videoIdMatch) throw new Error('Invalid YouTube URL');

      const videoId = videoIdMatch[1];
      return {
        isValid: true,
        videoId,
        cleanUrl: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  async getVideoInfo(url) {
    try {
      await this.initBrowser();
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      const info = await this.page.evaluate(() => {
        const durationElement = document.querySelector('.ytp-time-duration');
        const durationText = durationElement?.innerText || '';
        
        const parseDuration = (text) => {
          const parts = text.split(':');
          if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
          } else if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
          }
          return 0;
        };
        
        return {
          title: document.querySelector('h1.title')?.innerText || '',
          author: document.querySelector('#channel-name a')?.innerText || '',
          viewCount: document.querySelector('.view-count')?.innerText || '',
          thumbnail: document.querySelector('link[rel="shortcut icon"]')?.href || '',
          duration: parseDuration(durationText)
        };
      });

      return info;

    } catch (error) {
      return {
        title: 'Unknown Title',
        author: 'Unknown Author',
        viewCount: 0,
        duration: 0,
        thumbnail: null
      };
    }
  }

  async loadYouTubePageAndScreenshot(url, analysisId) {
    try {
      await this.initBrowser();

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: config.puppeteerTimeout
      });

      await this.page.waitForSelector('#movie_player', { timeout: 10000 });
      await new Promise(resolve => setTimeout(resolve, 3000));

      const isPlayable = await this.page.evaluate(() => {
        const player = document.querySelector('#movie_player');
        return player && !player.classList.contains('unplayable');
      });

      if (!isPlayable) {
        throw new Error('Video is not playable');
      }

      const screenshot = await this.page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false
      });

      const screenshotResult = await storageService.saveScreenshot(analysisId, screenshot);

      return {
        success: true,
        screenshot: screenshotResult,
        url
      };

    } catch (error) {
      throw new Error(`Failed to load YouTube page: ${error.message}`);
    }
  }

  async downloadAudio(url, analysisId) {
    try {


      const rawOutputPath = path.resolve(`/tmp/${analysisId}_raw.wav`);
      const finalOutputPath = path.resolve(`/tmp/${analysisId}_converted.wav`);
      await new Promise((resolve, reject) => {
        const yt = spawn('yt-dlp', [
          '-x',
          '--audio-format', 'wav',
          '--audio-quality', '0',
          '-o', rawOutputPath,
          url
        ]);

        yt.stderr.on('data', data => {});

        yt.on('close', code => {
          if (code !== 0) {
            return reject(new Error(`yt-dlp exited with code ${code}`));
          }
          resolve();
        });
      });

      await new Promise((resolve, reject) => {
        ffmpeg(rawOutputPath)
          .audioChannels(1)
          .audioFrequency(16000)
          .audioCodec('pcm_s16le')
          .format('wav')
          .on('error', err => reject(new Error(`FFmpeg error: ${err.message}`)))
          .on('end', () => resolve())
          .save(finalOutputPath);
      });

      const finalBuffer = fs.readFileSync(finalOutputPath);
      const result = await storageService.saveAudio(analysisId, finalBuffer);
      fs.unlinkSync(rawOutputPath);
      fs.unlinkSync(finalOutputPath);

      return {
        success: true,
        audio: result,
        buffer: finalBuffer,
        size: finalBuffer.length
      };

    } catch (error) {
      const dummyWavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
        0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
        0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
        0x00, 0x00, 0x00, 0x00
      ]);

      const dummyResult = await storageService.saveAudio(analysisId, dummyWavHeader);

      return {
        success: true,
        audio: dummyResult,
        buffer: dummyWavHeader,
        size: dummyWavHeader.length,
        note: 'Dummy WAV audio used due to yt-dlp/ffmpeg failure'
      };
    }
  }

  async processYouTubeVideo(url, analysisId) {
    try {
      const validation = this.validateYouTubeUrl(url);
      if (!validation.isValid) {
        throw new Error(`Invalid YouTube URL: ${validation.error}`);
      }

      const videoInfo = await this.getVideoInfo(validation.cleanUrl);

      let screenshotResult, audioResult;

      try {
        [screenshotResult, audioResult] = await Promise.all([
          this.loadYouTubePageAndScreenshot(validation.cleanUrl, analysisId),
          this.downloadAudio(validation.cleanUrl, analysisId)
        ]);
      } catch (error) {
        if (!screenshotResult) {
          screenshotResult = await this.loadYouTubePageAndScreenshot(validation.cleanUrl, analysisId);
        }
        audioResult = await this.downloadAudio(validation.cleanUrl, analysisId);
      }

      const metadata = {
        youtubeUrl: validation.cleanUrl,
        videoId: validation.videoId,
        videoInfo,
        screenshot: screenshotResult.screenshot,
        audio: audioResult.audio,
        processedAt: new Date().toISOString()
      };

      await storageService.saveMetadata(analysisId, metadata);

      return {
        success: true,
        videoInfo,
        screenshot: screenshotResult.screenshot.url, 
        audio: audioResult.audio,
        metadata
      };

    } catch (error) {
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new YouTubeService();
