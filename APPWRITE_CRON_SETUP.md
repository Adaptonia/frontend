# 🚀 Appwrite Functions Cron Setup (FREE Alternative)

## **Why Use Appwrite Functions Instead of Vercel Cron:**

- ✅ **100% FREE** (no need for Vercel Pro)
- ✅ **Already set up** in your project
- ✅ **More reliable** (runs on Appwrite's infrastructure)
- ✅ **Better integration** with your database

## **Setup Instructions:**

### **1. Deploy Your Appwrite Function**

You already have the function in `functions/check-due-reminders/`. Deploy it:

```bash
# Navigate to the function directory
cd functions/check-due-reminders

# Deploy to Appwrite
appwrite functions createDeployment \
  --functionId=check-due-reminders \
  --activate=true \
  --entrypoint="index.js" \
  --code="."
```

### **2. Configure Scheduled Execution**

1. **Open Appwrite Console** → **Functions** → `check-due-reminders`
2. **Go to "Settings"** → **"Schedule"**
3. **Set schedule:** `* * * * *` (every minute)
4. **Enable "Execute on schedule"**

### **3. Set Environment Variables in Appwrite**

Add these environment variables to your Appwrite function:

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_REMINDERS_COLLECTION_ID=reminders
APPWRITE_PUSH_TOKENS_COLLECTION_ID=push_tokens
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### **4. Test the Function**

```bash
# Test execution manually
appwrite functions createExecution \
  --functionId=check-due-reminders \
  --data='{}'
```

## **How It Works:**

1. **Appwrite Function runs every minute** (scheduled execution)
2. **Queries due reminders** from your database
3. **Sends FCM notifications** directly
4. **Updates reminder status** to 'sent'
5. **Handles retries** automatically

## **Advantages Over Vercel Cron:**

- **No monthly fees** ($0 vs $20/month)
- **Better database access** (direct connection)
- **More reliable** (dedicated infrastructure)
- **Easier debugging** (Appwrite console logs)

## **Your Notification System Now:**

```
Primary: Appwrite Functions (every minute) ✅ FREE
Backup: Local Service Worker (when app open) ✅ FREE
Total Cost: $0/month 🎉
```

## **Remove Vercel Cron Dependencies:**

Since we're not using Vercel cron anymore, you can remove:
- The cron API route (optional, keep for testing)
- CRON_SECRET environment variable (optional)
- NEXTAUTH_URL dependency (optional)

Your deployment will work perfectly on Vercel's free tier! 🚀 