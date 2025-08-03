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
      console.log('📝 Starting transcription for analysis:', analysisId);
      console.log('📝 Audio buffer size:', audioBuffer.length);
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.log('📝 Error: Empty audio buffer');
        throw new Error('Empty audio buffer');
      }

      const response = await axios.post(
        'https://api.elevenlabs.io/v1/speech-to-text',
        audioBuffer,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'audio/wav'
          },
          timeout: config.elevenLabsTimeout
        }
      );

      console.log('📝 ElevenLabs response status:', response.status);
      console.log('📝 ElevenLabs response data:', JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.words) {
        console.log('📝 Error: Invalid response from ElevenLabs');
        throw new Error('Invalid response from ElevenLabs');
      }

      const transcript = this.formatTranscript(response.data);
      console.log('📝 Formatted transcript:', JSON.stringify(transcript, null, 2));

      return {
        transcript: {
          data: {
            transcript: transcript
          }
        },
        metadata: {
          source: 'elevenlabs',
          wordCount: response.data.words?.length || 0,
          duration: response.data.words?.length > 0 ? 
            response.data.words[response.data.words.length - 1].end : 0
        }
      };

    } catch (error) {
      console.log('📝 Transcription error:', error.message);
      throw new Error(`Transcription failed: ${error.message}`);
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
      console.log('Processing audio for transcription...');
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
