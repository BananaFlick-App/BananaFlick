const https = require('https');

const API_KEY = 'bAMFxGgdEhhN6MVtOsvqg5bwSO-Igtjdwh3pNHpJ_p4';
const host = 'xmdbapi.com';
const movieId = 299534; // A known ID (Avengers: Endgame) or similar

const paths = [
    `/api/v1/movie/${movieId}`,
    `/api/v1/title/${movieId}`,
    `/api/v1/details/${movieId}`,
    `/movie/${movieId}`,
    `/title/${movieId}`,
    `/details/${movieId}`
];

paths.forEach(p => {
    const options = {
        hostname: host,
        path: p,
        method: 'GET',
        headers: { 'x-api-key': API_KEY }
    };
    const req = https.request(options, (res) => {
        console.log(`PATH: ${p} | STATUS: ${res.statusCode}`);
    });
    req.on('error', (e) => {
        console.log(`PATH: ${p} | ERROR: ${e.message}`);
    });
    req.end();
});
