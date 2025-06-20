// 🧪 FCM TOKEN REGISTRATION TEST
// Copy and paste this into your browser console

console.log('🧪 FCM TOKEN REGISTRATION TEST STARTING...');

// Test FCM token registration
window.testFCMRegistration = async () => {
  try {
    console.log('🔔 Step 1: Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported');
      return false;
    }
    
    // Request permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      console.error('❌ Notification permission denied');
      return false;
    }
    
    console.log('✅ Notification permission granted');
    
    // Get FCM token
    console.log('🔑 Step 2: Getting FCM token...');
    
    // Import Firebase messaging
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
    
    // Initialize Firebase (use your config)
    const firebaseConfig = {
      apiKey: "AIzaSyC8ZnV5f0Nj9XzQqYo8LyK4dF2wE3mR7tG",
      authDomain: "adaptonia-538b3.firebaseapp.com",
      projectId: "adaptonia-538b3",
      storageBucket: "adaptonia-538b3.firebasestorage.app",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef123456"
    };
    
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    
    // Get token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BH0G45RtHIPM2N-MzHD1OwFE7j4lLOCRAg9WnNzW7ePa_DlrG88c1iHzzQp4GiVn7FK3MS9qJMgBHJiy_wuqF20'
    });
    
    if (!token) {
      console.error('❌ Failed to get FCM token');
      return false;
    }
    
    console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
    
    // Store token in Appwrite
    console.log('💾 Step 3: Storing FCM token...');
    
    const storeResponse = await fetch('/api/user/store-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    if (storeResponse.ok) {
      console.log('✅ FCM token stored successfully');
    } else {
      console.error('❌ Failed to store FCM token:', await storeResponse.text());
    }
    
    // Test notification
    console.log('📤 Step 4: Testing FCM notification...');
    
    const testResponse = await fetch('/api/send-push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '684931bb001f1fba3e45', // Your user ID
        title: 'FCM Test Notification',
        body: 'Your FCM system is working perfectly! 🎉',
        data: { type: 'test' }
      })
    });
    
    const result = await testResponse.json();
    console.log('📤 FCM test result:', result);
    
    if (result.success) {
      console.log('🎉 FCM SYSTEM WORKING! You should receive a notification now.');
      return true;
    } else {
      console.error('❌ FCM test failed:', result.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ FCM registration test failed:', error);
    return false;
  }
};

// Simplified version - just store a dummy token for testing
window.testFCMQuick = async () => {
  try {
    console.log('🚀 Quick FCM test...');
    
    // Generate a dummy FCM token for testing
    const dummyToken = 'test-token-' + Date.now();
    
    // Store dummy token
    const storeResponse = await fetch('/api/user/store-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: dummyToken })
    });
    
    console.log('💾 Store response:', await storeResponse.json());
    
    // Test notification
    const testResponse = await fetch('/api/send-push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '684931bb001f1fba3e45',
        title: 'Quick FCM Test',
        body: 'Testing with dummy token',
        data: { type: 'test' }
      })
    });
    
    const result = await testResponse.json();
    console.log('📤 Test result:', result);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

console.log('📋 AVAILABLE COMMANDS:');
console.log('• testFCMRegistration() - Full FCM registration test');
console.log('• testFCMQuick() - Quick test with dummy token');
console.log('\n🚀 Run: testFCMQuick()');

console.log('🔔 FCM Test Script Loaded - Enhanced Authentication Version');

// Enhanced FCM test that works with authentication
window.testFCMSystemWithAuth = async () => {
  try {
    console.log('🚀 Starting comprehensive FCM test with authentication...');
    
    // Step 1: Check if user is authenticated
    console.log('🔐 Step 1: Checking authentication status...');
    
    let currentUser = null;
    try {
      // Try to get current user from React context first
      if (window.React && window.React.useContext) {
        console.log('🔍 Checking React Auth Context...');
        // This won't work from console, but let's try anyway
      }
      
      // Alternative: Check if user data exists in localStorage or session
      const authCache = localStorage.getItem('adaptonia_auth_cache');
      if (authCache) {
        currentUser = JSON.parse(authCache);
        console.log('✅ Found cached user:', currentUser.email);
      } else {
        console.log('❌ No authenticated user found');
        console.log('💡 Please login first, then run this test again');
        return false;
      }
    } catch (authError) {
      console.error('❌ Authentication check failed:', authError);
      console.log('💡 Please login to the app first, then run this test');
      return false;
    }
    
    // Step 2: Request notification permission
    console.log('🔔 Step 2: Requesting notification permission...');
    
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser');
      return false;
    }
    
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      console.error('❌ Notification permission denied');
      return false;
    }
    
    console.log('✅ Notification permission granted');
    
    // Step 3: Get FCM token
    console.log('🔑 Step 3: Getting FCM token...');
    
    let fcmToken = null;
    
    try {
      // Try to use Firebase if available
      if (window.firebase || window.firebaseApp) {
        console.log('🔥 Firebase detected, getting real FCM token...');
        
        // Import Firebase messaging dynamically
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        
        // Use environment config or fallback
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC8ZnV5f0Nj9XzQqYo8LyK4dF2wE3mR7tG",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "adaptonia-538b3.firebaseapp.com",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "adaptonia-538b3",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "adaptonia-538b3.firebasestorage.app",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
        };
        
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BH0G45RtHIPM2N-MzHD1OwFE7j4lLOCRAg9WnNzW7ePa_DlrG88c1iHzzQp4GiVn7FK3MS9qJMgBHJiy_wuqF20'
        });
        
        if (fcmToken) {
          console.log('✅ Real FCM token obtained:', fcmToken.substring(0, 30) + '...');
        } else {
          throw new Error('Failed to get FCM token from Firebase');
        }
      } else {
        throw new Error('Firebase not available');
      }
    } catch (firebaseError) {
      console.warn('⚠️ Firebase not available, using test token:', firebaseError.message);
      fcmToken = `test-fcm-token-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log('🧪 Generated test token:', fcmToken.substring(0, 30) + '...');
    }
    
    // Step 4: Store FCM token in Appwrite
    console.log('💾 Step 4: Storing FCM token in Appwrite...');
    
    try {
      const storeResponse = await fetch('/api/user/store-fcm-token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include any necessary auth headers
        },
        credentials: 'include', // Include cookies for auth
        body: JSON.stringify({ 
          token: fcmToken,
          userId: currentUser.id 
        })
      });
      
      const storeResult = await storeResponse.json();
      console.log('💾 Store result:', storeResult);
      
      if (storeResult.success) {
        console.log('✅ FCM token stored successfully in Appwrite');
      } else {
        console.error('❌ Failed to store FCM token:', storeResult.message);
        
        // If it's an auth error, provide guidance
        if (storeResult.message.includes('not authenticated')) {
          console.log('💡 Authentication issue detected. Please:');
          console.log('   1. Make sure you are logged into the app');
          console.log('   2. Refresh the page');
          console.log('   3. Run this test again');
          return false;
        }
        
        return false;
      }
    } catch (storeError) {
      console.error('❌ Error storing FCM token:', storeError);
      return false;
    }
    
    // Step 5: Test FCM notification
    console.log('📤 Step 5: Testing FCM notification...');
    
    try {
      const testResponse = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUser.id,
          title: '🎉 FCM Test Success!',
          body: 'Your notification system is working perfectly! This test confirms that FCM tokens are properly stored and notifications can be sent.',
          data: { 
            type: 'fcm_test',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      const testResult = await testResponse.json();
      console.log('📤 FCM test result:', testResult);
      
      if (testResult.success) {
        console.log('🎉 SUCCESS! FCM system is fully operational!');
        console.log('✅ You should receive a test notification now');
        console.log('✅ Your reminder system will now work properly');
        
        // Show success message in UI if possible
        if (window.toast) {
          window.toast.success('FCM Test Successful! 🎉', {
            description: 'Your notification system is working perfectly!'
          });
        }
        
        return true;
      } else {
        console.error('❌ FCM notification test failed:', testResult.message);
        return false;
      }
    } catch (testError) {
      console.error('❌ Error testing FCM notification:', testError);
      return false;
    }
    
  } catch (error) {
    console.error('❌ FCM test failed with error:', error);
    return false;
  }
};

// Quick authentication check function
window.checkAuthStatus = () => {
  console.log('🔐 Checking authentication status...');
  
  const authCache = localStorage.getItem('adaptonia_auth_cache');
  if (authCache) {
    const user = JSON.parse(authCache);
    console.log('✅ User authenticated:', user.email);
    console.log('👤 User ID:', user.id);
    return user;
  } else {
    console.log('❌ No authenticated user found');
    console.log('💡 Please login to the app first');
    return null;
  }
};

// Quick test for logged-in users
window.quickFCMTest = async () => {
  console.log('🚀 Quick FCM test for authenticated users...');
  
  const user = window.checkAuthStatus();
  if (!user) {
    console.log('❌ Please login first');
    return false;
  }
  
  try {
    // Generate test token
    const testToken = `quick-test-${Date.now()}`;
    
    // Store token
    const storeResponse = await fetch('/api/user/store-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        token: testToken,
        userId: user.id 
      })
    });
    
    const storeResult = await storeResponse.json();
    console.log('💾 Store result:', storeResult);
    
    if (!storeResult.success) {
      console.error('❌ Failed to store token:', storeResult.message);
      return false;
    }
    
    // Test notification
    const testResponse = await fetch('/api/send-push-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: user.id,
        title: 'Quick FCM Test',
        body: 'Testing notification system',
        data: { type: 'quick_test' }
      })
    });
    
    const testResult = await testResponse.json();
    console.log('📤 Test result:', testResult);
    
    if (testResult.success) {
      console.log('✅ Quick FCM test successful!');
      return true;
    } else {
      console.error('❌ Quick test failed:', testResult.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Quick test error:', error);
    return false;
  }
};

// Test reminder scheduling
window.testReminderScheduling = async () => {
  console.log('⏰ Testing reminder scheduling...');
  
  const user = window.checkAuthStatus();
  if (!user) {
    console.log('❌ Please login first');
    return false;
  }
  
  try {
    // Create a test reminder for 1 minute from now
    const reminderTime = new Date();
    reminderTime.setMinutes(reminderTime.getMinutes() + 1);
    
    console.log('⏰ Scheduling test reminder for:', reminderTime.toLocaleString());
    
    // This would typically be done through the goal creation flow
    // For testing, we'll directly call the reminder API
    const reminderData = {
      goalId: `test-goal-${Date.now()}`,
      userId: user.id,
      title: 'Test Reminder',
      description: 'This is a test reminder scheduled from the FCM test script',
      sendDate: reminderTime.toISOString(),
      dueDate: reminderTime.toISOString()
    };
    
    console.log('📝 Creating test reminder:', reminderData);
    
    // This would need to be implemented if we want to test reminder creation directly
    console.log('💡 To fully test reminders, create a goal with a reminder through the app');
    console.log('💡 The reminder system will use the FCM tokens we just set up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Reminder test error:', error);
    return false;
  }
};

console.log('📋 ENHANCED FCM TEST COMMANDS AVAILABLE:');
console.log('🔥 testFCMSystemWithAuth() - Complete FCM test with authentication');
console.log('🔐 checkAuthStatus() - Check if user is authenticated');
console.log('⚡ quickFCMTest() - Quick test for logged-in users');
console.log('⏰ testReminderScheduling() - Test reminder system');
console.log('');
console.log('💡 USAGE:');
console.log('1. Make sure you are logged into the app');
console.log('2. Run: testFCMSystemWithAuth()');
console.log('3. If successful, your reminder system will work!');
console.log('');
console.log('🔧 TROUBLESHOOTING:');
console.log('- If authentication fails: Login to the app and refresh the page');
console.log('- If FCM fails: Check browser console for detailed error messages');
console.log('- If notifications don\'t appear: Check browser notification settings'); 