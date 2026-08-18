FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4001
ENV PORT=4001
CMD ["node", "index.js"]
