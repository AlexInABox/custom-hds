FROM node:18

WORKDIR /custom-hds

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 2052

CMD ["npm", "start"]