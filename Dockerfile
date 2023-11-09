# syntax=docker/dockerfile:1

FROM openjdk:8u312-jre-buster

LABEL version="4.2.4"

RUN apt-get update && apt-get install -y curl unzip && \
 adduser --uid 99 --gid 100 --home /data --disabled-password minecraft

COPY launch.sh /launch.sh
RUN chmod +x /launch.sh

USER minecraft

VOLUME /data
WORKDIR /data

EXPOSE 25565/tcp

CMD ["/launch.sh"]

ENV MOTD "SkyFactory 4 - v4.2.4 Server Powered by Docker"
ENV LEVEL world
ENV JVM_OPTS "-Xms3072m -Xmx4096m"