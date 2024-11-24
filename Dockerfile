FROM node:18-slim

WORKDIR /custom-hds

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80 81 82

CMD ["npm", "start"]