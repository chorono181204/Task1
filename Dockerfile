
FROM node:18-alpine


RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    ffmpeg

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser


WORKDIR /app


COPY server/package*.json ./


RUN npm ci --only=production


COPY server/ ./


RUN mkdir -p uploads/screenshots uploads/audio uploads/results


EXPOSE 8080


HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"


CMD ["node", "app.js"] 