const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('📋 Add these to your .env.local file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('\n🚨 IMPORTANT:');
console.log('- Keep the private key SECRET and secure');
console.log('- The public key can be shared with the client');
console.log('- Replace "your-email@example.com" with your actual email');
console.log('- These keys enable TRUE background push notifications'); 