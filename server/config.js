require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  
  
  
  uploadsDir: process.env.UPLOADS_DIR || './uploads',
  screenshotsDir: process.env.SCREENSHOTS_DIR || './uploads/screenshots',
  audioDir: process.env.AUDIO_DIR || './uploads/audio',
  resultsDir: process.env.RESULTS_DIR || './uploads/results',
  
  puppeteerHeadless: process.env.PUPPETEER_HEADLESS === 'true',
  puppeteerTimeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
  
  ffmpegAudioFormat: process.env.FFMPEG_AUDIO_FORMAT || 'wav',
  ffmpegSampleRate: parseInt(process.env.FFMPEG_SAMPLE_RATE) || 16000,
  ffmpegChannels: parseInt(process.env.FFMPEG_CHANNELS) || 1,
  ffmpegBitDepth: parseInt(process.env.FFMPEG_BIT_DEPTH) || 16,
  
  elevenLabsTimeout: parseInt(process.env.ELEVENLABS_TIMEOUT) || 60000,
  huggingFaceTimeout: parseInt(process.env.HUGGINGFACE_TIMEOUT) || 30000,
  
  corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:3000'),
  
  logLevel: process.env.LOG_LEVEL || 'info',
  
  validateConfig() {
    const required = ['elevenLabsApiKey'];
    const missing = required.filter(key => !this[key]);
    return missing.length === 0;
  }
}; 