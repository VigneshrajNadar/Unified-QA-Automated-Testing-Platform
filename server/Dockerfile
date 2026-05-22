FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install OS-level dependencies required for node-gyp or python scripts
RUN apk add --no-cache python3 py3-pip make g++ git openjdk11 gcompat

# Create Python virtual environment and install packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install pytest pytest-html selenium requests beautifulsoup4 requests-html w3lib lxml g4f

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

# Copy application code
COPY . .

# Expose API port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
