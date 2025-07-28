FROM node:20

# Install qpdf
RUN apt-get update && apt-get install -y qpdf

# Create app directory
WORKDIR /app

# Copy files
COPY package*.json ./
COPY server.js ./
COPY public ./public

# Install dependencies
RUN npm install

# Create uploads folder
RUN mkdir uploads

# Run app
CMD ["node", "server.js"]
