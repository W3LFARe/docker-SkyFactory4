import fs from 'fs';
import fetch from 'node-fetch';
import { CurseForgeClient } from 'curseforge-api';

const client = new CurseForgeClient(process.env.CURSEFORGE_API_KEY, { fetch });

(async () => {
  try {
    const modId = '392141'; // Correct mod ID for SkyFactory 5
    const response = await client.getModFiles(modId, { pageSize: 1, index: 0, sortField: 'date', sortOrder: 'desc' });
    console.log('API Response:', response); // Log the entire response to debug

    // Extract the file from the response data
    const file = response.data[0];
    console.log('Fetched file:', file);

    if (!file) {
      throw new Error('No files found for the specified mod ID.');
    }

    // Ensure the file has an alternateFileId
    if (!file.alternateFileId) {
      throw new Error('The latest file does not have an alternateFileId.');
    }

    // Get the latest server version and download URL
    const versionMatch = file.fileName.match(/(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
      throw new Error('Could not extract version number from file name.');
    }
    const latestVersion = versionMatch[1]; // Extracted version number
    const serverPackFileId = file.alternateFileId.toString(); // Use alternateFileId
    const serverZipUrl = `https://edge.forgecdn.net/files/${serverPackFileId.slice(0, 4)}/${serverPackFileId.slice(4, 7)}/SkyFactory_5_Server_${latestVersion}.zip`;
    console.log('Latest Version:', latestVersion);
    console.log('Server Zip URL:', serverZipUrl);

    // Read the launch.sh file
    const launchScriptPath = './launch.sh';
    let launchScript = fs.readFileSync(launchScriptPath, 'utf8');
    console.log('Original launch.sh:', launchScript);

    // Helper function to compare versions
    const compareVersions = (v1, v2) => {
      const v1Parts = v1.split('.').map(Number);
      const v2Parts = v2.split('.').map(Number);
      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const a = v1Parts[i] || 0;
        const b = v2Parts[i] || 0;
        if (a > b) return 1;
        if (a < b) return -1;
      }
      return 0;
    };

    // Define the new Forge version
    const newForgeVersion = '1.20.1-47.3.0';

    // Get the current FORGE_VERSION from the launch script
    const forgeVersionMatch = launchScript.match(/FORGE_VERSION=(\d+\.\d+\.\d+-\d+\.\d+\.\d+)/);
    const currentForgeVersion = forgeVersionMatch ? forgeVersionMatch[1] : '0';

    // Update SERVER_VERSION and SERVER_ZIP_URL placeholders
    launchScript = launchScript.replace(/SERVER_VERSION=\d+\.\d+\.\d+/, `SERVER_VERSION=${latestVersion}`);
    launchScript = launchScript.replace(/SERVER_ZIP_URL=".*"/, `SERVER_ZIP_URL="${serverZipUrl}"`);

    // Update FORGE_VERSION if the current version is older
    if (compareVersions(currentForgeVersion, newForgeVersion) < 0) {
      launchScript = launchScript.replace(/FORGE_VERSION=\d+\.\d+\.\d+-\d+\.\d+\.\d+/, `FORGE_VERSION=${newForgeVersion}`);
    }

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
    console.error('Error:', error.message);
    console.error('Stack Trace:', error.stack);
  }
})();
