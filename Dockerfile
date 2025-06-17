FROM mcr.microsoft.com/playwright:v1.44.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit

COPY . .

CMD ["node", "index.js"]
