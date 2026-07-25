const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');
content = content.replace('request.auth.token.email_verified == true &&', '');
fs.writeFileSync('firestore.rules', content);
