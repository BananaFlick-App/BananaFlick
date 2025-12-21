const https = require('https');

const API_KEY = 'bAMFxGgdEhhN6MVtOsvqg5bwSO-Igtjdwh3pNHpJ_p4';
const host = 'xmdbapi.com';

function get(path, cb) {
    const options = {
        hostname: host,
        path: path,
        method: 'GET',
        headers: { 'x-api-key': API_KEY }
    };
    https.request(options, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => cb(res.statusCode, data));
    }).end();
}

console.log('Fetching trending...');
get('/api/v1/trending', (status, data) => {
    if (status === 200) {
        try {
            const json = JSON.parse(data);
            if (json.results && json.results.length > 0) {
                const movie = json.results[0];
                console.log('MOVIE OBJECT:', JSON.stringify(movie, null, 2));
            }
        } catch (e) { console.error(e); }
    }
});
