FROM node:10-alpine

ADD ./ /app

RUN cd /app/admin \
  && yarn install && yarn build \
  && mv ./dist/fonts ./dist/css/ \
  && rm -rf node_modules/ \
  && cd .. \
  && yarn install --production \
  && yarn cache clean \
  && yarn gen-version \
  && yarn autoclean --force

CMD ["node", "--experimental-modules", "/app/src/app"]

HEALTHCHECK --interval=10s --timeout=3s \
  CMD node --experimental-modules /app/build/check.mjs || exit 1