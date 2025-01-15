#!/bin/bash

set -x

if ! [[ -w "/data" ]]; then
  echo "Directory is not writable, check permissions for /mnt/user/appdata/vaulthunters3"
  exit 66
fi

FORGE_VERSION=1.20.1-47.3.0
SERVER_VERSION=SkyFactory5-5.0.5
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
  curl -Lo Server-Files-$SERVER_VERSION.zip 'https://edge.forgecdn.net/files/6085/603/SkyFactory5-5.0.5.zip'
  curl -Lo forge-${FORGE_VERSION}-installer.jar 'https://maven.minecraftforge.net/net/minecraftforge/forge/'${FORGE_VERSION}'/forge-'${FORGE_VERSION}'-installer.jar'
  java -jar forge-${FORGE_VERSION}-installer.jar --installServer && rm -f forge-${FORGE_VERSION}-installer.jar
fi

if [[ -n "$JVM_OPTS" ]]; then
  sed -i '/-Xm[s,x]/d' user_jvm_args.txt
  for j in ${JVM_OPTS}; do
    sed -i "\$a$j" user_jvm_args.txt
  done
fi
if [[ -n "$MOTD" ]]; then
    sed -i "s/motd\s*=/ c motd=$MOTD" /data/server.properties
fi
if [[ -n "$ENABLE_WHITELIST" ]]; then
    sed -i "s/white-list=.*/white-list=$ENABLE_WHITELIST/" /data/server.properties
fi

[[ ! -f whitelist.json ]] && echo "[]" > whitelist.json
IFS=',' read -ra USERS <<< "$WHITELIST_USERS"
for raw_username in "${USERS[@]}"; do
    username=$(echo "$raw_username" | xargs)
    if [[ ! "$username" =~ ^[a-zA-Z0-9_]{3,16}$ ]]; then
        echo "Whitelist: Invalid username: '$username'. Skipping..."
        continue
    fi

    UUID=$(curl -s "https://api.mojang.com/users/profiles/minecraft/$username" | jq -r '.id')
    if [[ "$UUID" != "null" ]]; then
        if jq -e ".[] | select(.uuid == \"$UUID\")" whitelist.json > /dev/null; then
            echo "Whitelist: $username ($UUID) is already whitelisted."
        else
            UUID=$(echo "$UUID" | sed -r 's/(.{8})(.{4})(.{4})(.{4})(.{12})/\1-\2-\3-\4-\5/')
            echo "Whitelist: Adding $username ($UUID) to whitelist."
            jq ". += [{\"uuid\": \"$UUID\", \"name\": \"$username\"}]" whitelist.json > tmp.json && mv tmp.json whitelist.json
        fi
    else
        echo "Whitelist: Failed to fetch UUID for $username."
    fi
done

[[ ! -f ops.json ]] && echo "[]" > ops.json
IFS=',' read -ra OPS <<< "$OP_USERS"
for raw_username in "${OPS[@]}"; do
    username=$(echo "$raw_username" | xargs)
    if [[ ! "$username" =~ ^[a-zA-Z0-9_]{3,16}$ ]]; then
        echo "Ops: Invalid username: '$username'. Skipping..."
        continue
    fi

    UUID=$(curl -s "https://api.mojang.com/users/profiles/minecraft/$username" | jq -r '.id')
    if [[ "$UUID" != "null" ]]; then
        if jq -e ".[] | select(.uuid == \"$UUID\")" ops.json > /dev/null; then
            echo "Ops: $username ($UUID) is already an operator."
        else
            UUID=$(echo "$UUID" | sed -r 's/(.{8})(.{4})(.{4})(.{4})(.{12})/\1-\2-\3-\4-\5/')
            echo "Ops: Adding $username ($UUID) as operator."
            jq ". += [{\"uuid\": \"$UUID\", \"name\": \"$username\", \"level\": 4, \"bypassesPlayerLimit\": false}]" ops.json > tmp.json && mv tmp.json ops.json
        fi
    else
        echo "Ops: Failed to fetch UUID for $username."
    fi
done

sed -i 's/server-port.*/server-port=25565/g' server.properties
chmod 755 run.sh

./run.sh
