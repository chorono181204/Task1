
FROM node:18-alpine


RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ffmpeg \
    python3 \
    py3-pip \
    curl

# Install yt-dlp using curl
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser


WORKDIR /app


COPY package*.json ./


RUN npm ci --only=production


COPY . ./


RUN mkdir -p uploads/screenshots uploads/audio uploads/results


EXPOSE 8080


HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"


CMD ["node", "app.js"] 