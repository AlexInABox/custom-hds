FROM node:18-slim

WORKDIR /custom-hds

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2052 2082

CMD ["npm", "start"]