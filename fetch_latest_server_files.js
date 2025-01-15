import fs from 'fs';
import fetch from 'node-fetch';
import { CurseForgeClient } from 'curseforge-api';

const client = new CurseForgeClient(process.env.CURSEFORGE_API_KEY, { fetch });

(async () => {
  try {
    const modId = '392141'; // Correct mod ID for SkyFactory 5
    const response = await client.getModFiles(modId);
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

    // Filter for server files (assuming server files have 'Server' in their displayName)
    const serverFiles = files.filter(file => file.displayName.toLowerCase().includes('server'));
    console.log('Filtered Server Files:', serverFiles);

    // Sort the server files by date to get the latest one
    const latestServerFile = serverFiles.sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))[0];
    console.log('Latest Server File:', latestServerFile);

    if (!latestServerFile) {
      throw new Error('No server files found.');
    }

    // Get the latest server version and download URL
    const latestVersion = latestServerFile.fileName.replace('.zip', ''); // Use the file name without the .zip extension
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
    console.error('Error:', error.message);
    console.error('Stack Trace:', error.stack);
  }
})();
