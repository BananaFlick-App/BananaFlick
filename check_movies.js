// check_movies.js
// using native fetch

const url = 'https://kxpcwleogbutevqujqoz.supabase.co/functions/v1/movies?action=discover&region=US&page=1';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cGN3bGVvZ2J1dGV2cXVqcW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE2ODksImV4cCI6MjA4MTMwNzY4OX0.YaiJ119ZSEwAd5dc9mGvw9Rx06zN7kCDjd3Jz1RjkG4';

(async () => {
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Results count:', data.results?.length);
        if (data.results && data.results.length > 0) {
            console.log('First item:', data.results[0]);
        }
    } catch (e) {
        console.error('Error:', e);
    }
})();
