# Use official Node.js image as base
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose port (assuming your app listens on 8080)
EXPOSE 8080

# Command to run your app
CMD ["node", "index.js"]
