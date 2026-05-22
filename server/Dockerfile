FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install OS-level dependencies required for node-gyp or python scripts
RUN apk add --no-cache python3 py3-pip make g++ git openjdk11 gcompat

# Create Python virtual environment and install packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install pytest pytest-html selenium requests beautifulsoup4 requests-html w3lib lxml g4f webdriver-manager

# Install k6 from Grafana releases (statically linked for Linux)
RUN apk add --no-cache curl && \
    curl -L https://github.com/grafana/k6/releases/download/v0.50.0/k6-v0.50.0-linux-amd64.tar.gz | tar -xz && \
    mv k6-v0.50.0-linux-amd64/k6 /usr/bin/k6 && \
    chmod +x /usr/bin/k6 && \
    rm -rf k6-v0.50.0-linux-amd64

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Install Chromium natively for Alpine (Playwright fallback)
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy application code
COPY . .

# Expose API port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
