FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Create the landing directory in dist and copy static files
RUN mkdir -p dist/landing
COPY src/landing/ dist/landing/

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (these will be overridden at runtime)
ENV NODE_ENV="production"
ENV SOLANA_RPC_URL=""
ENV POLYGON_API_KEY=""

# Copy the start script
CMD find /app/dist -type d && echo "Starting server..." && node --env-file=.env dist/server.js
