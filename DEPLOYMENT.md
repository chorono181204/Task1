# YouTube Analysis Service - Deployment Guide

## GCE VM Deployment

### 1. Create VM Instance
```bash
gcloud compute instances create youtube-analysis \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --tags=http-server,https-server
```

### 2. Firewall Rules
```bash

gcloud compute firewall-rules create allow-http \
  --allow tcp:8080 \
  --target-tags=http-server \
  --source-ranges=0.0.0.0/0 \
  --description="Allow HTTP traffic on port 8080"

gcloud compute firewall-rules create allow-ssh \
  --allow tcp:22 \
  --target-tags=http-server \
  --source-ranges=0.0.0.0/0 \
  --description="Allow SSH access"
```

### 3. SSH Port-Forward (Fallback)
```bash

gcloud compute ssh youtube-analysis --zone=us-central1-a


ssh -L 8080:localhost:8080 username@VM_IP
```

### 4. Deploy Application
```bash

gcloud compute ssh youtube-analysis --zone=us-central1-a


sudo apt-get update
sudo apt-get install -y docker.io docker-compose


git clone <your-repo-url>
cd youtube-analysis-service


export ELEVENLABS_API_KEY="your_api_key_here"
export HUGGINGFACE_API_KEY="your_hf_key_here" # Optional


docker-compose up -d


docker-compose logs -f
```

### 5. Health Check
```bash
# Test the service
curl http://VM_IP:8080/health

# Test analysis
curl -X POST http://VM_IP:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key |
| `HUGGINGFACE_API_KEY` | No | Hugging Face API key (optional) |
| `PORT` | No | Server port (default: 8080) |
| `NODE_ENV` | No | Environment (default: production) |

## Monitoring

### Health Check Endpoint
```bash
curl http://VM_IP:8080/health
```

### Service Status
```bash
curl http://VM_IP:8080/analyze/health
```

### Storage Info
```bash
curl http://VM_IP:8080/analyze/storage
```

## Troubleshooting

### Common Issues

1. **Port 8080 not accessible**
   - Check firewall rules
   - Verify VM is running
   - Check Docker container logs

2. **ElevenLabs API errors**
   - Verify API key is set
   - Check account credits
   - Review API rate limits

3. **Puppeteer issues**
   - Ensure VM has enough memory (2GB+)
   - Check Chrome dependencies
   - Review headless mode settings

### Logs
```bash
# View application logs
docker-compose logs -f youtube-analysis

# View system logs
sudo journalctl -u docker
```

## Security Notes

- Firewall only allows HTTP on port 8080
- SSH access should be restricted in production
- Consider using HTTPS with reverse proxy
- Monitor API usage and costs 