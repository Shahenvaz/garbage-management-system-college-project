FROM node:16
COPY package.json package-lock.json .
RUN npm update
COPY . .
EXPOSE 8081
CMD ["node","index.js"]
