# Use official Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY .env ./

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Create required directories
RUN mkdir -p /usr/src/app/data /usr/src/app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]