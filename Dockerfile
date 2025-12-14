FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]