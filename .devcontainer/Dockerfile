# Base image with Node.js 20
FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install Azure CLI (optional, since your original devcontainer had it)
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Set working directory
WORKDIR /workspace

# Copy project files
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Expose frontend + backend ports
EXPOSE 3000 8080

# Default command: run both frontend and backend
CMD ["bash", "-c", "node server.js & npm start"]
