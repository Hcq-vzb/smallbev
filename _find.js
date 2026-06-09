const s = require('fs').readFileSync('bundle.js', 'utf8');
const mailtos = [...s.matchAll(/mailto:([^"']+)/g)].map(m => m[1]);
console.log('mailtos:', [...new Set(mailtos)]);
