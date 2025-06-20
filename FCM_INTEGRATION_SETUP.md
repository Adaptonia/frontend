# FCM Integration Setup Guide

This document outlines the complete setup process for integrating Goal Reminders with Firebase Cloud Messaging (FCM) for reliable cross-platform notifications, especially on iOS devices.

## Architecture Overview

### **Three-Layer Notification System:**
1. **Primary**: Appwrite Functions (server-side scheduler)
2. **Secondary**: Vercel Cron Jobs (backup scheduler)  
3. **Tertiary**: Local Service Worker (fallback for desktop/development)

### **Why FCM Integration:**
- **iOS Compatibility**: Local service worker notifications don't work reliably on iOS
- **Background Reliability**: FCM works even when the app is completely closed
- **Cross-Platform**: Consistent notification experience across all devices
- **Server-Side Scheduling**: True scheduled notifications, not client-dependent

## Setup Instructions

### **1. Appwrite Function Setup**

#### A. Deploy `check-due-reminders` Function:
```bash
# Navigate to functions directory
cd functions/check-due-reminders

# Deploy to Appwrite
appwrite functions createDeployment \
  --functionId=check-due-reminders \
  --activate=true \
  --entrypoint="index.js" \
  --code="."
```

#### B. Configure Scheduled Execution:
1. Open Appwrite Console → Functions → `check-due-reminders`
2. Go to "Settings" → "Schedule"
3. Set schedule: `* * * * *` (every minute)
4. Enable "Execute on schedule"

#### C. Set Environment Variables:
```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
APPWRITE_PUSH_TOKENS_COLLECTION_ID=your-push-tokens-collection-id
APPWRITE_SEND_PUSH_NOTIFICATION_FUNCTION_ID=your-send-push-function-id
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

### **2. Vercel Deployment Setup**

#### A. Environment Variables:
Add to Vercel Dashboard → Settings → Environment Variables:
```bash
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
# ... (all other env vars from .env.example)

# Cron Security
CRON_SECRET=generate-secure-random-string
```

#### B. Vercel Cron Configuration:
The `vercel.json` file is already configured to run the backup cron every minute.

### **3. Firebase Setup**

#### A. Create Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or use existing
3. Enable "Cloud Messaging"

#### B. Generate VAPID Keys:
```bash
# Run the included script
node scripts/generate-vapid-keys.js
```

#### C. Configure Firebase Admin:
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Add the JSON content to `FIREBASE_SERVICE_ACCOUNT` environment variable

### **4. Database Schema Update**

Ensure your `reminders` collection has these attributes:
```typescript
interface Reminder {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sendDate: string;        // ISO string when to send
  dueDate?: string;        // Goal deadline  
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;      // For failed notification retries
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  nextRetry?: string;      // Next retry attempt time
}
```

## How It Works

### **Reminder Creation Flow:**
1. User creates goal with reminder settings
2. `reminderService.createReminder()` stores reminder in database with `status: 'pending'`
3. Local service worker schedules backup notification (fallback)
4. FCM system handles primary delivery

### **Notification Delivery Flow:**
1. **Appwrite Function** runs every minute:
   - Queries for `status: 'pending'` reminders where `sendDate <= now`
   - Sends FCM notification via existing `send-push-notification` function
   - Updates reminder status to `'sent'`

2. **Vercel Cron** (backup) runs every minute:
   - Same logic as Appwrite function
   - Only processes reminders if Appwrite function missed them
   - Provides redundancy

3. **Local Service Worker** (fallback):
   - Continues checking for due reminders
   - Shows local notifications for desktop users
   - Serves as last resort if server-side fails

### **Error Handling & Retries:**
- **Automatic Retries**: Failed notifications retry up to 3 times
- **30-minute Delays**: Between retry attempts
- **Status Tracking**: Each reminder tracks success/failure state
- **Comprehensive Logging**: All steps logged for debugging

## Testing

### **1. Test Notification System:**
```javascript
// In browser console
window.PWANotificationManager.testReminder()
```

### **2. Test Cron Endpoint:**
```bash
curl -X GET "https://your-app.vercel.app/api/cron/check-reminders" \
  -H "Authorization: Bearer your-cron-secret"
```

### **3. Test Appwrite Function:**
```bash
appwrite functions createExecution \
  --functionId=check-due-reminders \
  --data='{}'
```

## Deployment Checklist

- [ ] Appwrite function deployed with scheduled execution
- [ ] Firebase project configured with FCM enabled
- [ ] All environment variables set in Vercel
- [ ] Vercel cron job configured (`vercel.json`)
- [ ] Database collections have correct schema
- [ ] VAPID keys generated and configured
- [ ] Cron secret configured for security

## Monitoring & Logs

### **Appwrite Function Logs:**
- Appwrite Console → Functions → `check-due-reminders` → Executions

### **Vercel Cron Logs:**
- Vercel Dashboard → Functions → View logs for cron executions

### **Client-Side Logs:**
- Browser DevTools → Console (look for FCM-related messages)

## Troubleshooting

### **Notifications Not Sending:**
1. Check Appwrite function execution logs
2. Verify Firebase service account credentials
3. Ensure FCM tokens are being stored correctly
4. Check reminder status in database

### **iOS Issues:**
1. Verify VAPID keys are correctly configured
2. Check that Firebase messaging service worker is registered
3. Ensure PWA is installed on device

### **Backup System:**
If primary FCM fails, the local service worker will continue showing notifications for users who have the app open. The Vercel cron provides server-side redundancy.

## Performance Notes

- **Function Execution**: Processes max 50 reminders per run (Appwrite), 25 per run (Vercel)
- **Frequency**: Every minute execution ensures 1-minute maximum delay
- **Scaling**: Can handle thousands of reminders with current architecture
- **Costs**: Minimal - only executes when there are due reminders

---

This FCM integration solves the iOS notification reliability issue while maintaining backward compatibility with existing local notification systems. 