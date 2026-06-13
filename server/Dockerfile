# syntax=docker/dockerfile:1

# ---------- Base: cài dependencies + generate Prisma Client ----------
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# ---------- Dev (mặc định trong docker-compose) ----------
# Source được compose mount đè lên /app nên sửa code là nodemon tự reload;
# node_modules dùng bản trong image (anonymous volume) để khỏi cài lại trên host.
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- Build production ----------
FROM base AS build
RUN npm run build && npm prune --omit=dev

# ---------- Production: chỉ chứa dist + node_modules runtime ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.js ./prisma.config.js
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
