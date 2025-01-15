// fetch_latest_server_files.js
import fs from 'fs';
import fetch from 'node-fetch';
import { CurseForgeClient } from 'curseforge-api';

const client = new CurseForgeClient(process.env.CURSEFORGE_API_KEY, { fetch });

(async () => {
  try {
    const files = await client.getModFiles('skyfactory-5');
    // Filter for server files
    const serverFiles = files.filter(file => file.fileName.includes('server'));
    const latestServerFile = serverFiles[0]; // Assuming the first file is the latest
    console.log('Latest Server File:', latestServerFile);
    // Get the latest server version and download URL
    const latestVersion = latestServerFile.fileDate;
    const serverZipUrl = latestServerFile.downloadUrl;
    console.log('Latest Version:', latestVersion);
    console.log('Server Zip URL:', serverZipUrl);
    // Read the launch.sh file
    const launchScriptPath = './launch.sh';
    let launchScript = fs.readFileSync(launchScriptPath, 'utf8');
    console.log('Original launch.sh:', launchScript);
    // Update SERVER_VERSION and server.zip link
    launchScript = launchScript.replace(/SERVER_VERSION=.*/, `SERVER_VERSION=${latestVersion}`);
    launchScript = launchScript.replace(/https:\/\/edge\.forgecdn\.net\/files\/\d+\/\d+\/.*/, serverZipUrl);
    // Write the updated launch.sh file
    fs.writeFileSync(launchScriptPath, launchScript);
    console.log('Updated launch.sh:', launchScript);

    // Read the Dockerfile
    const dockerfilePath = './Dockerfile';
    let dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
    console.log('Original Dockerfile:', dockerfile);
    // Update relevant parts of the Dockerfile
    dockerfile = dockerfile.replace(/LABEL version=".*"/, `LABEL version="${latestVersion}"`);
    // Write the updated Dockerfile
    fs.writeFileSync(dockerfilePath, dockerfile);
    console.log('Updated Dockerfile:', dockerfile);
  } catch (error) {
    console.error(error);
  }
})();
