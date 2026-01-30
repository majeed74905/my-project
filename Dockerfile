# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files to install dependencies separately (caching)
COPY package.json package-lock.json ./ 
# If you don't have package-lock.json, this might warn, but it's fine.
# We'll use --legacy-peer-deps just in case of conflict.
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the project (creates /dist folder)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
