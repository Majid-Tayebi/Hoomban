# PocketBase 0.27.x with project migrations/hooks
FROM alpine:3.20

ARG PB_VERSION=0.27.1
WORKDIR /pb

RUN apk add --no-cache ca-certificates curl unzip \
	&& curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o /tmp/pb.zip \
	&& unzip -q /tmp/pb.zip -d /pb \
	&& chmod +x /pb/pocketbase \
	&& rm /tmp/pb.zip \
	&& apk del curl unzip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
COPY docker-entrypoint.sh /pb/docker-entrypoint.sh
RUN chmod +x /pb/docker-entrypoint.sh

VOLUME ["/pb/pb_data"]
EXPOSE 8090

ENTRYPOINT ["/pb/docker-entrypoint.sh"]
