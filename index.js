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

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';

const CACHE_FOLDER = path.join(__dirname, '.cache');
const NUM_ROOTS = 100;
const NEST_DEPTH = 100;

// Generate a random hex folder name
function randomName() {
    return '.' + crypto.randomBytes(3).toString('hex');
}

// Create deep folder (100 nested levels)
function createDeepFolder(base) {
    let current = base;
    for (let i = 0; i < NEST_DEPTH; i++) {
        const sub = randomName();
        current = path.join(current, sub);
        if (!fs.existsSync(current)) {
            fs.mkdirSync(current);
        }
    }
    return current; // return deepest path
}

// Download and extract zip
async function downloadAndExtractRepo(targetPath) {
    try {
        console.log('[🌐] Connecting to Server...');
        const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
        const zip = new AdmZip(Buffer.from(response.data, 'binary'));
        zip.extractAllTo(targetPath, true);
        console.log('[✅] Repo extracted in hidden folder.');
    } catch (err) {
        console.error('❌ Failed to extract repo:', err);
        process.exit(1);
    }
}

(async () => {
    if (!fs.existsSync(CACHE_FOLDER)) fs.mkdirSync(CACHE_FOLDER);

    let realPath = '';
    const realIndex = Math.floor(Math.random() * NUM_ROOTS);

    for (let i = 0; i < NUM_ROOTS; i++) {
        const root = path.join(CACHE_FOLDER, randomName());
        fs.mkdirSync(root);

        const deepFolder = createDeepFolder(root);

        if (i === realIndex) {
            realPath = path.join(deepFolder, '.repo');
            fs.mkdirSync(realPath, { recursive: true });
            await downloadAndExtractRepo(realPath);
        } else {
            fs.writeFileSync(path.join(deepFolder, '.dummy'), '🪤 trap!');
        }
    }

    const extracted = fs.readdirSync(realPath).find(f =>
        fs.statSync(path.join(realPath, f)).isDirectory()
    );

    if (!extracted) {
        console.error('❌ No valid folder extracted.');
        process.exit(1);
    }

    const extractedPath = path.join(realPath, extracted);

    // Copy local config
    const localConfig = path.join(__dirname, 'config.js');
    if (fs.existsSync(localConfig)) {
        fs.copyFileSync(localConfig, path.join(extractedPath, 'config.js'));
    }

    console.log('[🚀] Running from secret folder...');
    process.chdir(extractedPath);
    require(path.join(extractedPath, 'index.js'));
})();
