import fs from 'fs';
import fetch from 'node-fetch';
import { CurseForgeClient } from 'curseforge-api';
import { extract } from 'zip-lib';

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

    // Download and extract the server ZIP file
    const zipResponse = await fetch(serverZipUrl);
    const zipBuffer = await zipResponse.buffer();

    const zipFilePath = './server.zip';
    fs.writeFileSync(zipFilePath, zipBuffer);
    console.log('ZIP file downloaded successfully.');

    const extractPath = './server_files';
    await extract(zipFilePath, extractPath);
    console.log('ZIP file extracted successfully.');

    // Find the forge installer file and extract the version number
    const files = fs.readdirSync(extractPath);
    console.log('Extracted files:', files);

    const forgeInstallerFile = files.find(file => file.match(/forge-\d+\.\d+\.\d+-\d+\.\d+\.\d+-installer\.jar/));
    if (!forgeInstallerFile) {
      throw new Error('Forge installer file not found.');
    }

    const versionMatchForge = forgeInstallerFile.match(/forge-(\d+\.\d+\.\d+-\d+\.\d+\.\d+)-installer\.jar/);
    if (!versionMatchForge) {
      throw new Error('Could not extract version number from the forge installer file.');
    }

    const newForgeVersion = versionMatchForge[1]; // Extracted version number
    console.log('New Forge Version:', newForgeVersion);

    // Read the launch.sh file
    const launchScriptPath = './launch.sh';
    let launchScript = fs.readFileSync(launchScriptPath, 'utf8');
    console.log('Original launch.sh:', launchScript);

    // Replace placeholders in the script with the latest version values
    launchScript = launchScript.replace(/FORGE_VERSION=\d+\.\d+\.\d+-\d+\.\d+\.\d+|FORGE_VERSION=/, `FORGE_VERSION=${newForgeVersion}`);
    launchScript = launchScript.replace(/SERVER_VERSION=\d+\.\d+\.\d+|SERVER_VERSION=/, `SERVER_VERSION=${latestVersion}`);
    launchScript = launchScript.replace(/https:\/\/edge\.forgecdn\.net\/files\/\d+\/\d+\/SkyFactory_5_Server_\d+\.\d+\.\d+\.zip/, serverZipUrl);

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
