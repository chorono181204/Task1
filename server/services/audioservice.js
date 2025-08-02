const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const storageService = require('./storageService');


ffmpeg.setFfmpegPath(ffmpegStatic);

class AudioService {
  constructor() {
    this.audioFormat = config.ffmpegAudioFormat;
    this.sampleRate = config.ffmpegSampleRate;
    this.channels = config.ffmpegChannels;
    this.bitDepth = config.ffmpegBitDepth;
  }

  async convertToWav(audioBuffer, analysisId) {
    try {
      const tempInputPath = path.join(config.audioDir, `${analysisId}_temp.mp3`);
      const outputPath = path.join(config.audioDir, `${analysisId}_converted.wav`);
      
      
      await fs.writeFile(tempInputPath, audioBuffer);
      
      return new Promise((resolve, reject) => {
        ffmpeg(tempInputPath)
          .audioCodec('pcm_s16le')
          .audioChannels(this.channels)
          .audioFrequency(this.sampleRate)
          .outputOptions([
            '-ar', this.sampleRate.toString(),
            '-ac', this.channels.toString(),
            '-sample_fmt', 's16'
          ])
          .on('end', async () => {
            try {
              
              const convertedBuffer = await fs.readFile(outputPath);
              
              
              const audioResult = await storageService.saveAudio(analysisId, convertedBuffer);
              
              await Promise.allSettled([
                fs.unlink(tempInputPath).catch(() => {}),
                fs.unlink(outputPath).catch(() => {})
              ]);
              
              resolve({
                success: true,
                audio: audioResult,
                buffer: convertedBuffer,
                format: 'wav',
                sampleRate: this.sampleRate,
                channels: this.channels,
                bitDepth: this.bitDepth,
                size: convertedBuffer.length
              });
            } catch (error) {
              reject(new Error(`Failed to save converted audio: ${error.message}`));
            }
          })
          .on('error', (error) => {
            console.error('FFmpeg error:', error);
            reject(new Error(`FFmpeg conversion failed: ${error.message}`));
          })
          .save(outputPath);
      });
      
    } catch (error) {
      throw new Error(`Failed to convert audio: ${error.message}`);
    }
  }

  async convertFileToWav(inputPath, analysisId) {
    try {
      const outputPath = path.join(config.audioDir, `${analysisId}_converted.wav`);
      
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioCodec('pcm_s16le')
          .audioChannels(this.channels)
          .audioFrequency(this.sampleRate)
          .outputOptions([
            '-ar', this.sampleRate.toString(),
            '-ac', this.channels.toString(),
            '-sample_fmt', 's16'
          ])
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
          })
          .on('end', async () => {
            try {
              const convertedBuffer = await fs.readFile(outputPath);
              const audioResult = await storageService.saveAudio(analysisId, convertedBuffer);
              
              await fs.unlink(outputPath).catch(() => {});
              
              resolve({
                success: true,
                audio: audioResult,
                buffer: convertedBuffer,
                format: 'wav',
                sampleRate: this.sampleRate,
                channels: this.channels,
                bitDepth: this.bitDepth,
                size: convertedBuffer.length
              });
            } catch (error) {
              reject(new Error(`Failed to save converted audio: ${error.message}`));
            }
          })
          .on('error', (error) => {
            console.error('FFmpeg error:', error);
            reject(new Error(`FFmpeg conversion failed: ${error.message}`));
          })
          .save(outputPath);
      });
      
    } catch (error) {
      throw new Error(`Failed to convert audio file: ${error.message}`);
    }
  }

  async getAudioInfo(audioBuffer) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(config.audioDir, `temp_${Date.now()}.mp3`);
      
      fs.writeFile(tempPath, audioBuffer)
        .then(() => {
          ffmpeg.ffprobe(tempPath, (error, metadata) => {
            fs.unlink(tempPath).catch(() => {}); // Clean up
            
            if (error) {
              reject(new Error(`Failed to get audio info: ${error.message}`));
            } else {
              resolve({
                format: metadata.format.format_name,
                duration: metadata.format.duration,
                size: metadata.format.size,
                bitrate: metadata.format.bit_rate,
                audioStream: metadata.streams.find(s => s.codec_type === 'audio')
              });
            }
          });
        })
        .catch(reject);
    });
  }

  validateAudioFormat(audioBuffer) {
    if (!audioBuffer) {
      throw new Error('Audio buffer is null or undefined');
    }
    if (audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty');
    }
    return true;
  }

  async processAudio(audioBuffer, analysisId) {
    try {
      this.validateAudioFormat(audioBuffer);
      const originalInfo = await this.getAudioInfo(audioBuffer);
      const conversionResult = await this.convertToWav(audioBuffer, analysisId);
      const convertedInfo = await this.getAudioInfo(conversionResult.buffer);
      
      return {
        success: true,
        original: originalInfo,
        converted: convertedInfo,
        result: conversionResult
      };
      
    } catch (error) {
      throw new Error(`Failed to process audio: ${error.message}`);
    }
  }

  async cleanup() {
    try {
      const files = await fs.readdir(config.audioDir);
      const tempFiles = files.filter(file => 
        file.includes('temp_') || file.includes('_temp.')
      );
      await Promise.allSettled(
        tempFiles.map(file => 
          fs.unlink(path.join(config.audioDir, file)).catch(() => {})
        )
      );
    } catch (error) {
    }
  }
}

module.exports = new AudioService();

