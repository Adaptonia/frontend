// 🧪 ADAPTONIA NOTIFICATION TEST SCRIPT
// Copy and paste this into your browser console while on the dashboard

console.log('🧪 ADAPTONIA NOTIFICATION TEST SCRIPT LOADED');
console.log('📱 Testing notification system...');

// Test function for immediate notification
window.testInstantNotification = async () => {
  try {
    console.log('🚀 INSTANT TEST: Sending immediate notification...');
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser');
      return false;
    }
    
    // Request permission if needed
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('❌ Notification permission denied');
        return false;
      }
    }
    
    if (Notification.permission === 'granted') {
      // Show instant notification
      new Notification('🧪 Console Test Notification', {
        body: 'This test notification was sent from the browser console! Your notifications are working.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'console-test-notification'
      });
      
      console.log('✅ INSTANT TEST: Notification sent successfully!');
      return true;
    } else {
      console.error('❌ Notification permission not granted');
      return false;
    }
    
  } catch (error) {
    console.error('❌ INSTANT TEST: Failed:', error);
    return false;
  }
};

// Test function for 4-minute scheduled notification
window.testScheduledNotification = async () => {
  try {
    console.log('🧪 SCHEDULED TEST: Creating test reminder for 4 minutes from now...');
    
    // Calculate 4 minutes from now
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 4);
    
    console.log('⏰ TEST: Scheduled for:', testTime.toLocaleString());
    
    // Get current user (assuming you're logged in)
    const user = window.localStorage.getItem('user') || { id: 'test-user', email: 'test@example.com' };
    
    // Create a test reminder using the scheduling function
    const { scheduleReminders } = await import('/lib/utils/dateUtils.js');
    
    await scheduleReminders(
      `console-test-${Date.now()}`, // Unique test goal ID
      { enabled: false }, // No advanced reminders
      testTime.toISOString(), // Simple reminder in 4 minutes
      typeof user === 'string' ? JSON.parse(user) : user
    );
    
    console.log('✅ SCHEDULED TEST: Reminder created successfully');
    console.log('📱 TEST: Close your app now and wait 4 minutes for the notification!');
    console.log('🕐 TEST: Notification scheduled for:', testTime.toLocaleTimeString());
    
    return true;
    
  } catch (error) {
    console.error('❌ SCHEDULED TEST: Failed:', error);
    return false;
  }
};

// Quick test function - runs both tests
window.testNotifications = async () => {
  console.log('🧪 RUNNING COMPLETE NOTIFICATION TESTS...');
  
  // Test 1: Instant notification
  console.log('\n1️⃣ Testing instant notification...');
  const instantResult = await testInstantNotification();
  
  if (instantResult) {
    // Test 2: Scheduled notification
    console.log('\n2️⃣ Testing scheduled notification...');
    const scheduledResult = await testScheduledNotification();
    
    if (scheduledResult) {
      console.log('\n✅ ALL TESTS PASSED!');
      console.log('📱 You should have received an instant notification');
      console.log('⏰ You will receive a scheduled notification in 4 minutes');
      console.log('🚀 Close your app now to test background delivery!');
    } else {
      console.log('\n⚠️ Scheduled test failed, but instant test worked');
    }
  } else {
    console.log('\n❌ Instant test failed - check notification permissions');
  }
};

// Instructions
console.log('\n📋 AVAILABLE TEST COMMANDS:');
console.log('• testInstantNotification() - Send notification immediately');
console.log('• testScheduledNotification() - Schedule notification for 4 minutes');
console.log('• testNotifications() - Run both tests');
console.log('\n🚀 Run: testNotifications()'); 