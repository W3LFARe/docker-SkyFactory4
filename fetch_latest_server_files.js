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

    // Filter for server pack files using serverPackFileId
    const serverFiles = files.filter(file => file.serverPackFileId);
    console.log('Filtered Server Pack Files:', serverFiles);

    // Sort the server files by date to get the latest one
    const latestServerFile = serverFiles.sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))[0];
    console.log('Latest Server File:', latestServerFile);

    if (!latestServerFile) {
      throw new Error('No server pack files found.');
    }

    // Get the latest server version and download URL
    const latestVersion = latestServerFile.fileName.match(/SkyFactory[^\d]*(\d+\.\d+\.\d+)/)[1]; // Extract version number from file name
    const serverZipUrl = latestServerFile.downloadUrl;
    console.log('Latest Version:', latestVersion);
    console.log('Server Zip URL:', serverZipUrl);

    // Read the launch.sh file
    const launchScriptPath = './launch.sh';
    let launchScript = fs.readFileSync(launchScriptPath, 'utf8');
    console.log('Original launch.sh:', launchScript);

    // Update placeholders with actual values
    launchScript = launchScript.replace('{{SERVER_VERSION}}', latestVersion);
    launchScript = launchScript.replace('{{SERVER_ZIP_URL}}', serverZipUrl);
    console.log('Updated launch.sh:', launchScript);

    // Write the updated launch.sh file
    fs.writeFileSync(launchScriptPath, launchScript);
    console.log('Updated launch.sh saved.');

    // Read the Dockerfile
    const dockerfilePath = './Dockerfile';
    let dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
    console.log('Original Dockerfile:', dockerfile);

    // Update relevant parts of the Dockerfile
    dockerfile = dockerfile.replace(/LABEL version=".*"/, `LABEL version="${latestVersion}"`);
    console.log('Updated Dockerfile:', dockerfile);

    // Write the updated Dockerfile
    fs.writeFileSync(dockerfilePath, dockerfile);
    console.log('Updated Dockerfile saved.');

    // Add, commit, and push changes if there are any
    const { execSync } = require('child_process');
    execSync('git add -A');
    const commitMessage = `Update launch.sh and Dockerfile with latest server file info: ${latestVersion}`;
    try {
      execSync(`git commit -m '${commitMessage}'`);
      execSync('git push');
      console.log('Changes committed and pushed.');
    } catch (err) {
      console.log('No changes to commit.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack Trace:', error.stack);
  }
})();
