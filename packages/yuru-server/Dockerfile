FROM node:20

WORKDIR /usr/local/yuru-server

COPY . .
RUN npm install
RUN npm run build-

EXPOSE 3333

CMD ["node", "./dist/main.js"]