# YouTube Analysis Service

A Node.js service that analyzes YouTube videos by extracting audio, transcribing content, and detecting AI-generated text.

**Note:** Originally used GPTZero API, but switched to Hugging Face due to GPTZero no longer offering free tier.

## Features

- YouTube video processing with screenshot capture
- Audio extraction and conversion to WAV format
- Transcription with ElevenLabs Scribe
- AI analysis with Hugging Face API
- REST API and web interface

## Requirements

- Node.js 16+
- FFmpeg (handled by ffmpeg-static)
- ElevenLabs API key
- Hugging Face API (optional - free tier available)

## Installation

### 1. Clone the repository
```bash
git clone 
cd server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the `server` directory:

```bash
# Server Configuration
PORT=8080
NODE_ENV=development

# API Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# File Storage Paths
UPLOADS_DIR=./uploads
SCREENSHOTS_DIR=./uploads/screenshots
AUDIO_DIR=./uploads/audio
RESULTS_DIR=./uploads/results

# Puppeteer Configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000

# FFmpeg Configuration
FFMPEG_AUDIO_FORMAT=wav
FFMPEG_SAMPLE_RATE=16000
FFMPEG_CHANNELS=1
FFMPEG_BIT_DEPTH=16

# API Timeouts
ELEVENLABS_TIMEOUT=60000
HUGGINGFACE_TIMEOUT=30000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 4. Get API Keys

#### ElevenLabs API Key
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Go to API section
4. Create a new API key
5. Add it to your `.env` file

#### Hugging Face API (Optional)
- Free tier with 30,000 requests/month
- No API key required for basic usage
- Switched from GPTZero due to free tier removal

## Usage

### Start the server
```bash
npm run dev
```

The server will start on `http://localhost:8080`

### Web Interface
1. Open `http://localhost:8080` in your browser
2. Enter a YouTube URL
3. Click "Analyze Video"
4. Wait for processing to complete
5. View results with AI probability scores

### API Endpoints

#### POST /analyze
Start a new analysis:
```bash
curl -X POST http://localhost:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

#### GET /result/:id
Get analysis results:
```bash
curl http://localhost:8080/result/analysis_1234567890_abcdef12
```

#### GET /analyze/health
Check system health:
```bash
curl http://localhost:8080/analyze/health
```

## Sample Output

```json
{
  "success": true,
  "analysisId": "analysis_1703123456789_a1b2c3d4",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoInfo": {
    "title": "Sample Video",
    "duration": 120,
    "author": "Sample Author"
  },
  "screenshot": "/uploads/screenshots/analysis_1703123456789_a1b2c3d4.jpg",
  "summary": {
    "totalSentences": 10,
    "analyzedSentences": 10,
    "averageAIProbability": 0.75,
    "aiGeneratedSentences": 7,
    "humanGeneratedSentences": 2,
    "uncertainSentences": 1
  }
}
```

## Docker Deployment

```bash
# Build and run
docker-compose up -d
```

## Configuration

Required environment variables:
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `HUGGINGFACE_API_KEY` - Optional, for Hugging Face API

## Testing

```bash
# Health check
curl http://localhost:8080/health

# Test analysis
curl -X POST http://localhost:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## API Endpoints

- `POST /analyze` - Start video analysis
- `GET /result/:id` - Get analysis results
- `GET /analyze/health` - System health check

