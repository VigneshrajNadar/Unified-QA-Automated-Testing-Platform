FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install OS-level dependencies required for node-gyp or python scripts
RUN apk add --no-cache python3 py3-pip make g++ git openjdk11 gcompat

# Create Python virtual environment and install packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install pytest pytest-html selenium requests beautifulsoup4 requests-html w3lib lxml g4f webdriver-manager

# Install k6 natively via Alpine repository
RUN apk add --no-cache k6 --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing

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
