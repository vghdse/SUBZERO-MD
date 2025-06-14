const fs = require('fs');
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

