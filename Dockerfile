# Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port (if your app uses a port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3000/health', (res) => { if (res.statusCode !== 200) throw new Error('Health check failed') })"]

# Start command
CMD ["npm", "start"]