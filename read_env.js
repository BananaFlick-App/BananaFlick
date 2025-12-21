const fs = require('fs');
const path = require('path');
try {
    const content = fs.readFileSync(path.join(__dirname, 'backend', '.env'), 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
        const parts = line.split('=');
        if (parts.length > 0) {
            console.log('KEY: ' + parts[0].trim());
            if (parts[0].trim() === 'XMDB_BASE_URL') {
                console.log('VALUE: ' + parts.slice(1).join('=').trim());
            }
        }
    }
} catch (e) {
    console.error(e);
}
