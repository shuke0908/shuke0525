# Use Node.js LTS
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy next.config.js
COPY --from=builder /app/next.config.js ./

# Copy public directory
COPY --from=builder /app/public ./public

# Copy .next directory
COPY --from=builder /app/.next ./.next

# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json
COPY --from=builder /app/package.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Use tini as init process
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["npm", "start"]
