FROM node:18-alpine
WORKDIR /app
#  add libraries; sudo so non-root user added downstream can get sudo
 RUN apk add --no-cache --virtual .build-deps \
        build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
        cairo \
	jpeg \
	pango \
	giflib

#  add glibc and install canvas

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install


COPY ["build/", "./"]
CMD ["node", "index.js"]
