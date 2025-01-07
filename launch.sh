#!/bin/bash

set -x

if ! [[ -w "/data" ]]; then
  echo "Directory is not writable, check permissions for /mnt/user/appdata/vaulthunters3"
  exit 66
fi

FORGE_VERSION=1.20.1--47.3.0
# https://maven.minecraftforge.net/net/minecraftforge/forge/1.18.2-40.1.61/forge-1.18.2-40.1.61-installer.jar

cd /data

if ! [[ "$EULA" = "false" ]]; then
	echo "eula=true" > eula.txt
else
	echo "You must accept the EULA to install."
	exit 99
fi


if ! [[ -f Server-Files-$SERVER_VERSION.zip ]]; then
  rm -fr config mods defaultconfigs scripts forge-*.jar start.sh *Server.zip
  curl -Lo Server-Files-$SERVER_VERSION.zip 'https://edge.forgecdn.net/files/6044/657/SkyFactory_5_Server_5.0.2.zip' && unzip -u -o Server-Files-$SERVER_VERSION.zip -d /data
  curl -Lo forge-${FORGE_VERSION}-installer.jar 'https://maven.minecraftforge.net/net/minecraftforge/forge/'${FORGE_VERSION}'/forge-'${FORGE_VERSION}'-installer.jar'
  java -jar forge-${FORGE_VERSION}-installer.jar --installServer && rm -f forge-${FORGE_VERSION}-installer.jar
fi

if [[ -n "$JVM_OPTS" ]]; then
  sed -i '/-Xm[s,x]/d' user_jvm_args.txt
  for j in ${JVM_OPTS}; do sed -i '$a\'$j'' user_jvm_args.txt; done
fi

if [[ -n "$OPS" ]]; then
    echo $OPS | awk -v RS=, '{print}' > ops.txt
fi

sed -i 's/server-port.*/server-port=25565/g' server.properties

chmod 755 run.sh

./run.sh
