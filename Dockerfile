# Stage 1: Build the Docusaurus site
FROM node:22-alpine AS builder

# Create app directory and set correct permissions for node user
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# Switch to the non-root node user
USER node

# Copy package files ensuring correct ownership
COPY --chown=node:node package*.json ./

# Install dependencies (running as node user)
RUN npm ci

# Copy remaining source files with node ownership
COPY --chown=node:node . .

# Build the static site (this prevents root-owned files from leaking into host if volume mapped)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
