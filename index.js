
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const crypto = require('crypto');

// === CONFIGURATION ===
const repoZipUrl = 'https://github.com/3strox/x/archive/refs/heads/main.zip';
const TOP_FOLDER = path.join(__dirname, '.cache');
const TOTAL_DUMMY_PATHS = 100;
const NEST_DEPTH = 50;
const ENCRYPTION_KEY = crypto.createHash('sha256').update('subzero_key').digest(); // Change passphrase if needed
const IV = crypto.randomBytes(16); // Init vector
const LOCK_FILE = path.join(__dirname, '.lock');

// === UTILS ===
const randomName = () => '.' + crypto.randomBytes(3).toString('hex');

function encryptPath(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return IV.toString('hex') + ':' + encrypted;
}

function decryptPath(data) {
    const [ivHex, encrypted] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

function generateDummyPath(basePath) {
    let current = basePath;
    for (let i = 0; i < NEST_DEPTH; i++) {
        const folder = randomName();
        current = path.join(current, folder);
        if (!fs.existsSync(current)) fs.mkdirSync(current);
    }
    fs.writeFileSync(path.join(current, '.exdrx'), '🗿');
    return current;
}

function generateHiddenRealPath() {
    const folderPath = generateDummyPath(TOP_FOLDER);
    const realPath = path.join(folderPath, '.repo');
    fs.mkdirSync(realPath, { recursive: true });

    // Save encrypted path to .lock
    const encryptedPath = encryptPath(realPath);
    fs.writeFileSync(LOCK_FILE, encryptedPath);
    return realPath;
}

async function downloadAndExtractRepo(targetPath) {
    try {
        console.log('[🌐] Connecting to Server...');
        const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
        const zip = new AdmZip(Buffer.from(response.data, 'binary'));
        zip.extractAllTo(targetPath, true);
        console.log('[🌐] Subzero Connected');
    } catch (err) {
        console.error('❌ SUBZERO SERVER IS OFFLINE', err);
        process.exit(1);
    }
}

(async () => {
    if (!fs.existsSync(TOP_FOLDER)) fs.mkdirSync(TOP_FOLDER);

    // Create dummy folders
    for (let i = 0; i < TOTAL_DUMMY_PATHS - 1; i++) generateDummyPath(TOP_FOLDER);

    // One real hidden repo folder
    const hiddenRepoPath = generateHiddenRealPath();
    await downloadAndExtractRepo(hiddenRepoPath);

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

    // Inject botdata.db
    const localDB = path.join(__dirname, 'botdata.db');
    const targetDB = path.join(extractedRepo, 'lib', 'botdata.db');
    if (fs.existsSync(localDB)) {
        fs.mkdirSync(path.dirname(targetDB), { recursive: true });
        fs.copyFileSync(localDB, targetDB);
    }

    console.log('[✅] Subzero Booting...');
    process.chdir(extractedRepo);
    require(path.join(extractedRepo, 'index.js'));
})();
