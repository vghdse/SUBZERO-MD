/*const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// GitHub repo zip URL
const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';

const TOP_FOLDER = path.join(__dirname, '.cache');
const TOTAL_DUMMY_PATHS = 100;
const NEST_DEPTH = 15;

// Generate random hex folder name
const randomName = () => '.' + crypto.randomBytes(3).toString('hex');

// Create random dummy folder tree
function generateDummyPath(basePath) {
    let current = basePath;
    for (let i = 0; i < NEST_DEPTH; i++) {
        const folder = randomName();
        current = path.join(current, folder);
        if (!fs.existsSync(current)) fs.mkdirSync(current);
    }

    // Add dummy files
    fs.writeFileSync(path.join(current, '.execution'), '🗿');
    return current;
}

// Pick a random folder to hide the real repo
function generateHiddenRealPath() {
    const folderPath = generateDummyPath(TOP_FOLDER);
    const realPath = path.join(folderPath, '.repo');
    fs.mkdirSync(realPath, { recursive: true });
    return realPath;
}

async function downloadAndExtractRepo(targetPath) {
    try {
        console.log('[🌐] Connecting to Server...');
        const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
        const zip = new AdmZip(Buffer.from(response.data, 'binary'));
        zip.extractAllTo(targetPath, true);
        console.log('[🌐] Repo extracted in hidden path');
    } catch (err) {
        console.error('❌ SUBZERO SERVER IS OFFLINE', err);
        process.exit(1);
    }
}

(async () => {
    if (!fs.existsSync(TOP_FOLDER)) fs.mkdirSync(TOP_FOLDER);

    // Generate 99 dummy paths
    for (let i = 0; i < TOTAL_DUMMY_PATHS - 1; i++) generateDummyPath(TOP_FOLDER);

    // Generate the real one
    const hiddenRepoPath = generateHiddenRealPath();
    await downloadAndExtractRepo(hiddenRepoPath);

    // Find extracted folder (like x-main)
    const folders = fs.readdirSync(hiddenRepoPath).filter(f =>
        fs.statSync(path.join(hiddenRepoPath, f)).isDirectory()
    );

    if (!folders.length) {
        console.error('❌ No extracted repo found!');
        process.exit(1);
    }

    const extractedRepo = path.join(hiddenRepoPath, folders[0]);

    // Inject config.js
    const localConfig = path.join(__dirname, 'config.js');
    if (fs.existsSync(localConfig)) {
        fs.copyFileSync(localConfig, path.join(extractedRepo, 'config.js'));
    }

    console.log('[✅] Booting from secure location...');
    process.chdir(extractedRepo);
    require(path.join(extractedRepo, 'index.js'));
})();
*/

// bootstrap.js const fs = require('fs'); const path = require('path'); const axios = require('axios'); const AdmZip = require('adm-zip');

// GitHub repo zip URL const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';

// Generate very deep hidden path function generateDeepPath(base = '.cache', depth = 100) { let deepPath = path.join(__dirname, base); for (let i = 0; i < depth; i++) { const folder = '.' + Math.random().toString(36).substring(2, 8); deepPath = path.join(deepPath, folder); } return deepPath; }

const deepPath = generateDeepPath(); const repoFolder = path.join(deepPath, '.repo');

async function downloadAndExtractRepo() { try { console.log('[🌐 ] Connecting to Server...');

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

(async () => { await downloadAndExtractRepo();

const extractedFolders = fs.readdirSync(repoFolder).filter(f =>
    fs.statSync(path.join(repoFolder, f)).isDirectory());

if (!extractedFolders.length) {
    console.error('❌ No folder found in extracted repo');
    process.exit(1);
}

const extractedRepoPath = path.join(repoFolder, extractedFolders[0]);

// Save path to .lock
const lockPath = path.join(__dirname, '.lock');
fs.writeFileSync(lockPath, extractedRepoPath);
console.log('[🔐 ] Path saved to .lock');

// Copy config.js
const localConfig = path.join(__dirname, 'config.js');
if (fs.existsSync(localConfig)) {
    fs.copyFileSync(localConfig, path.join(extractedRepoPath, 'config.js'));
} else {
    console.log('[⚠️ ] No config.js found');
}

// Copy botdata.db to lib/
const localDB = path.join(__dirname, 'botdata.db');
const targetDB = path.join(extractedRepoPath, 'lib', 'botdata.db');
if (fs.existsSync(localDB)) {
    fs.mkdirSync(path.dirname(targetDB), { recursive: true });
    fs.copyFileSync(localDB, targetDB);
    console.log('[🗃️ ] Copied botdata.db to lib/');
} else {
    console.log('[⚠️ ] No botdata.db found');
}

// Change directory and run index.js
process.chdir(extractedRepoPath);
require(path.join(extractedRepoPath, 'index.js'));

})();

