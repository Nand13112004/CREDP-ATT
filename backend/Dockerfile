FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY src ./src

# Expose default backend port
EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
