# Base image: Node.js 18 on Alpine Linux
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including Passport.js for OAuth)
RUN npm install

# Copy application code
COPY . .

# Expose API port
EXPOSE 3000

# Start command
CMD ["npm", "start"]