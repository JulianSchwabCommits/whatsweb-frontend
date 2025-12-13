# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the React app
RUN npm run build

# Expose the default port (doesn’t have to match Azure)
EXPOSE 3000

# Start the server
CMD ["npx", "next", "start", "-p", "3000"]