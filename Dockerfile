FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Create volume for database
VOLUME ["/app/data"]

# Set environment variable for database path
ENV DB_PATH=/app/data/vinny.db

# Run the app
CMD ["node", "dist/index.js"]
