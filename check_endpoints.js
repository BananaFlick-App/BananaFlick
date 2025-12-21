const https = require('https');

const API_KEY = 'bAMFxGgdEhhN6MVtOsvqg5bwSO-Igtjdwh3pNHpJ_p4';
const host = 'xmdbapi.com';
const id = 'tt1757678'; // Known ID from trending

const prefixes = ['', '/api/v1', '/v1'];
const nouns = ['movie', 'movies', 'title', 'titles', 'id', 'details'];

const paths = [];
prefixes.forEach(pre => {
    nouns.forEach(noun => {
        paths.push(`${pre}/${noun}/${id}`);
    });
});

console.log(`Scanning ${paths.length} endpoints for ID ${id}...`);

function get(path, cb) {
    const options = { hostname: host, path: path, method: 'GET', headers: { 'x-api-key': API_KEY } };
    const req = https.request(options, (res) => {
        if (res.statusCode === 200) console.log(`[SUCCESS] ${path} : 200`);
        else process.stdout.write('.'); // progress dot
    });
    req.on('error', () => { });
    req.end();
}

paths.forEach(p => get(p));
