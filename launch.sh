#!/bin/bash

set -x

cd /data

if ! [[ "$EULA" = "false" ]] || grep -i true eula.txt; then
	echo "eula=true" > eula.txt
else
	echo "You must accept the EULA by in the container settings."
	exit 9
fi

if ! [[ -f SkyFactory_5_Server_5_0_2.zip ]]; then
	rm -fr config defaultconfigs global_data_packs global_resource_packs mods packmenu SkyFactory_5_Server_5*.zip
	curl -Lo SkyFactory_5_Server_5_0_2.zip 'https://edge.forgecdn.net/files/6044/657/SkyFactory_5_Server_5.0.2.zip' && unzip -u -o SkyFactory_5_Server_5_0_2.zip -d /data
	chmod +x Install.sh
	./Install.sh
fi

if [[ -n "$MOTD" ]]; then
    sed -i "/motd\s*=/ c motd=$MOTD" /data/server.properties
fi
if [[ -n "$LEVEL" ]]; then
    sed -i "/level-name\s*=/ c level-name=$LEVEL" /data/server.properties
fi
if [[ -n "$OPS" ]]; then
    echo $OPS | awk -v RS=, '{print}' > ops.txt
fi
if [[ -n "$ALLOWLIST" ]]; then
    echo $ALLOWLIST | awk -v RS=, '{print}' > white-list.txt
fi

. ./settings.sh
JVM_OPTS = $JVM_OPTS $JAVA_PARAMETERS
curl -Lo log4j2_112-116.xml https://launcher.mojang.com/v1/objects/02937d122c86ce73319ef9975b58896fc1b491d1/log4j2_112-116.xml
java -server $JVM_OPTS -Dfml.queryResult=confirm -Dlog4j.configurationFile=log4j2_112-116.xml -jar $SERVER_JAR nogui