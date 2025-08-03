const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

class TranscriptionService {
  constructor() {
    this.apiKey = config.elevenLabsApiKey;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.timeout = config.elevenLabsTimeout || 30000;
  }

  validateApiKey() {
    return !!this.apiKey;
  }

  async transcribeAudio(audioBuffer, analysisId) {
    try {
      if (!this.validateApiKey()) {
        throw new Error('Missing ElevenLabs API key');
      }

      const maxSize = 25 * 1024 * 1024;
      if (audioBuffer.length > maxSize) {
        throw new Error(`Audio too large: ${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB > 25MB`);
      }



      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: `${analysisId}.wav`,
        contentType: 'audio/wav'
      });
      formData.append('model_id', 'scribe_v1');
      formData.append('word_timestamps', 'true');
      formData.append('speaker_diarization', 'true');

      const response = await axios.post(`${this.baseUrl}/speech-to-text`, formData, {
        headers: {
          'xi-api-key': this.apiKey,
          ...formData.getHeaders()
        },
        timeout: this.timeout
      });

      const rawTranscript = response.data;
      const transcript = this.formatTranscript(rawTranscript);

      return {
        success: true,
        transcript,
        metadata: {
          model: rawTranscript.model_id,
          duration: rawTranscript.duration,
          language: rawTranscript.language,
          totalSentences: transcript.length,
          hasSpeakerDiarization: transcript.some(s => s.speaker !== null),
          hasWordTimestamps: transcript.some(s => s.words.length > 0)
        }
      };

    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      throw new Error(`Failed to transcribe audio: ${typeof message === 'object' ? JSON.stringify(message) : message}`);
    }
  }

  formatTranscript(data) {
    const transcript = [];
    if (data.words && Array.isArray(data.words)) {
      let currentSentence = {
        text: '',
        start: null,
        end: null,
        words: [],
        speaker: null
      };

              for (const word of data.words) {
         
          const shouldSplit = currentSentence.start && (
            
            word.start - currentSentence.end > 1.0 || 
            
            (word.speaker && word.speaker !== currentSentence.speaker) ||
           
            currentSentence.text.split(' ').length > 30 ||
           
            (currentSentence.text.trim().match(/[.!?]$/) && word.start - currentSentence.end > 0.3) ||
          
            (currentSentence.end - currentSentence.start > 6)
          );
          
          if (shouldSplit) {
            if (currentSentence.text.trim()) {
              transcript.push({
                text: currentSentence.text.trim(),
                start: currentSentence.start,
                end: currentSentence.end,
                speaker: currentSentence.speaker,
                words: currentSentence.words
              });
            }
            currentSentence = {
              text: '',
              start: word.start,
              end: word.end,
              words: [],
              speaker: word.speaker
            };
          }

                  currentSentence.text += word.text + ' ';
          currentSentence.end = word.end;
          currentSentence.words.push({
            text: word.text,
            start: word.start,
            end: word.end,
            speaker: word.speaker
          });
          if (!currentSentence.start) {
            currentSentence.start = word.start;
          }
        }

      if (currentSentence.text.trim()) {
        transcript.push({
          text: currentSentence.text.trim(),
          start: currentSentence.start,
          end: currentSentence.end,
          speaker: currentSentence.speaker,
          words: currentSentence.words
        });
      }

    } else if (data.text) {
     
      const sentences = this.splitTextIntoSentences(data.text);
      let currentTime = 0;
      const timePerSentence = data.duration / sentences.length;
      
      for (const sentenceText of sentences) {
        transcript.push({
          text: sentenceText.trim(),
          start: currentTime,
          end: currentTime + timePerSentence,
          speaker: null,
          words: []
        });
        currentTime += timePerSentence;
      }
    }

    return transcript;
  }


  splitTextIntoSentences(text) {
   
    let sentences = text.split(/(?<=[.!?])\s+/);
    
    
    sentences = sentences.flatMap(sentence => {
      if (sentence.length > 120) {
        return sentence.split(/,\s+/).map(s => s.trim());
      }
      return [sentence];
    });
    
    
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 5 && s.length < 100)
      .filter(s => s.length > 0);
  }

  async getAvailableModels() {
    try {
      if (!this.validateApiKey()) throw new Error('Missing API key');

      const response = await axios.get(`${this.baseUrl}/speech-to-text/models`, {
        headers: { 'xi-api-key': this.apiKey },
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      console.error('Error getting models:', message);
      throw new Error(`Failed to get models: ${message}`);
    }
  }

  async testConnection() {
    try {
      if (!this.validateApiKey()) throw new Error('Missing API key');

      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: { 'xi-api-key': this.apiKey },
        timeout: 10000
      });

      return {
        success: true,
        user: response.data,
        apiKey: this.apiKey ? 'Valid' : 'Missing'
      };

    } catch (error) {
      const message = error.response?.data?.detail || error.message;
      console.error('Error testing connection:', message);
      return {
        success: false,
        error: message
      };
    }
  }

  async processAudioForTranscription(audioBuffer, analysisId) {
    try {
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Invalid audio buffer');
      }

      const result = await this.transcribeAudio(audioBuffer, analysisId);
      return result;

    } catch (error) {
      console.error('Error processing audio for transcription:', error);
      throw new Error(`Failed to process audio for transcription: ${error.message}`);
    }
  }
}

module.exports = new TranscriptionService();
