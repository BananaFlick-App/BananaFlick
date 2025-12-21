const https = require('https');

const API_KEY = 'bAMFxGgdEhhN6MVtOsvqg5bwSO-Igtjdwh3pNHpJ_p4';
const host = 'xmdbapi.com';
// Use the ID we know works from previous steps
const id = 'tt1757678';

function get(path, cb) {
    const options = { hostname: host, path: path, method: 'GET', headers: { 'x-api-key': API_KEY } };
    https.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => cb(res.statusCode, data));
    }).end();
}

console.log(`Fetching details for ${id}...`);
get(`/api/v1/movies/${id}`, (status, data) => {
    console.log(`STATUS: ${status}`);
    if (status === 200) {
        try {
            const json = JSON.parse(data);
            console.log('KEYS:', Object.keys(json));
            console.log('poster_url:', json.poster_url);
            console.log('backdrop_url:', json.backdrop_url);
            console.log('genres:', JSON.stringify(json.genres));
            console.log('rating:', json.rating);
            console.log('release_year:', json.release_year);
            console.log('runtime_minutes:', json.runtime_minutes);
        } catch (e) { console.error('Parse error', e); }
    } else {
        console.log('Body:', data);
    }
});
