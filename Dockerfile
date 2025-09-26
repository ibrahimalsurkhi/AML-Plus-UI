# Multi-stage build for optimized production image
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_APP_API_URL=https://34.36.135.193/api
ARG VITE_APP_ENVIRONMENT=qa
ARG VITE_APP_VERSION=9.1.2

# Set environment variables for build
ENV VITE_APP_API_URL=$VITE_APP_API_URL
ENV VITE_APP_ENVIRONMENT=$VITE_APP_ENVIRONMENT
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose port 8080 (required by Cloud Run)
EXPOSE 8080

# Start nginx with custom configuration
CMD ["/start.sh"]
