import fs from 'fs';
import fetch from 'node-fetch';
import { CurseForgeClient } from 'curseforge-api';

const client = new CurseForgeClient(process.env.CURSEFORGE_API_KEY, { fetch });

(async () => {
  try {
    const modId = '392141'; // Correct mod ID for SkyFactory 5
    const response = await client.getModFiles(modId, { pageSize: 50, index: 0, sortField: 'date', sortOrder: 'desc' });
    console.log('API Response:', response); // Log the entire response to debug

    // Extract the files from the response data
    const files = response.data;
    console.log('Fetched files:', files);

    // Check if files is an array
    if (!Array.isArray(files)) {
      throw new Error('Expected files to be an array, but received: ' + typeof files);
    }

    // Check if any files are returned
    if (files.length === 0) {
      throw new Error('No files found for the specified mod ID.');
    }

    // Filter for server pack files using alternateFileId
    const serverFiles = files.filter(file => file.alternateFileId);
    console.log('Filtered Server Pack Files:', serverFiles);

    // Sort the server files by date to get the latest one
    const latestServerFile = serverFiles.sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))[0];
    console.log('Latest Server File:', latestServerFile);

    if (!latestServerFile) {
      throw new Error('No server pack files found.');
    }

    // Get the latest server version and download URL
    const versionMatch = latestServerFile.fileName.match(/(\d+\.\d+\.\d+)/);
    if (!versionMatch) {
      throw new Error('Could not extract version number from file name.');
    }
    const latestVersion = versionMatch[1]; // Extracted version number
    const serverPackFileId = latestServerFile.alternateFileId.toString(); // Convert to string for manipulation
    const serverZipUrl = `https://edge.forgecdn.net/files/${serverPackFileId.slice(0, 4)}/${serverPackFileId.slice(4, 7)}/${serverPackFileId}/SkyFactory_5_Server_${latestVersion}.zip`;
    console.log('Latest Version:', latestVersion);
    console.log('Server Zip URL:', serverZipUrl);

    // Read the launch.sh file
    const launchScriptPath = './launch.sh';
    let launchScript = fs.readFileSync(launchScriptPath, 'utf8');
    console.log('Original launch.sh:', launchScript);

    // Update placeholders with actual values
    launchScript = launchScript.replace('{{SERVER_VERSION}}', latestVersion);
    launchScript = launchScript.replace('{{SERVER_ZIP_URL}}', serverZipUrl);

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
    fs.writeFileSync(dockerfile
