# Base: install dependencies
FROM node:18-alpine as base

WORKDIR /user/src/app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

# Creating a build:
FROM node:18-alpine as create-build
WORKDIR /user/src/app
COPY --from=base /user/src/app ./
RUN yarn run build
USER node

# Running the application:
FROM node:18-alpine AS run
WORKDIR /user/src/app

COPY --from=base /user/src/app/node_modules ./node_modules
COPY --from=create-build /user/src/app/dist ./dist
COPY package.json ./

# Prune off the dev dependencies after build step
RUN yarn install --production

CMD ["yarn", "run", "start:prod"]