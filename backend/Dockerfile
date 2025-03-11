# Use an official Node.js runtime as a base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the application code to the container
COPY . .

# Build TypeScript code
RUN npx tsc

# Expose the port on which your app will run
EXPOSE 4000

# Command to run your application
CMD ["node", "build/start.js"]