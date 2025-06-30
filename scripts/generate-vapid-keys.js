const webpush = require('web-push');

console.log('🔑 Generating new VAPID keys for Firebase Cloud Messaging...\n');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('📋 Add these to your environment variables:\n');

console.log('For .env.local and Vercel:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:adaptonia@gmail.com\n`);

console.log('For Appwrite Functions:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:adaptonia@gmail.com\n`);

console.log('🔥 Firebase Console Setup:');
console.log('1. Go to Firebase Console > Project Settings > Cloud Messaging');
console.log('2. In the "Web configuration" section, click "Generate key pair"');
console.log('3. OR if you want to use these keys:');
console.log('   - Click on the existing key pair');
console.log('   - Replace it with the public key above');
console.log(`   - Public Key: ${vapidKeys.publicKey}\n`);

console.log('⚠️  Important Notes:');
console.log('- The public key must be added to Firebase Console');
console.log('- The private key is used server-side only');
console.log('- Both keys must match for FCM to work');
console.log('- Restart your dev server after updating .env.local'); 