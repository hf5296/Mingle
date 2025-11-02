# Dockerfile for deployment (Phase E: Deploy in VM using Docker)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]