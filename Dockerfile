# syntax=docker/dockerfile:1

FROM openjdk:21-buster

LABEL version="Tue Jan 14 2025 04:59:56 GMT+0000 (Coordinated Universal Time)"

RUN apt-get update && apt-get install -y curl unzip jq && \
    adduser --uid 99 --gid 100 --home /data --disabled-password minecraft

COPY launch.sh /launch.sh
RUN chmod +x /launch.sh

USER minecraft

VOLUME /data
WORKDIR /data

EXPOSE 25565/tcp

CMD ["/launch.sh"]
