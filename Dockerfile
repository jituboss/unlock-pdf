FROM node:24-slim

ARG APP_VERSION=dev
ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.title="pdf-unlock" \
      org.opencontainers.image.source="https://github.com/jituboss/unlock-pdf" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}"

# Install qpdf
RUN apt-get update \
  && apt-get install -y --no-install-recommends qpdf \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Install dependencies from the lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy app files
COPY server.js ./
COPY public ./public

# Run as non-root
RUN mkdir uploads && chown node:node uploads
USER node

EXPOSE 3000
CMD ["node", "server.js"]
