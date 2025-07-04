# Vercel Cron Jobs Setup Guide

## 📧 Automatic Email Reminders with Vercel Cron Jobs

This guide shows you how to deploy automatic email reminders using Vercel cron jobs.

## ✅ What's Already Set Up

1. **Cron Job Function**: `/api/cron/email-reminders/route.ts`
2. **Vercel Configuration**: `vercel.json`
3. **Security**: CRON_SECRET authentication

## 🚀 Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel dashboard → Project → Settings → Environment Variables and add:

```bash
# Required for email sending
RESEND_API_KEY=re_xxxxxxxxx

# Required for cron security (generate random 16+ chars)
CRON_SECRET=your-secure-random-string-here

# Required for Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_REMINDERS_COLLECTION_ID=your-reminders-collection-id
APPWRITE_USERS_COLLECTION_ID=your-users-collection-id
```

### 2. Generate CRON_SECRET

Use a password generator to create a secure random string:
```bash
# Example (generate your own):
CRON_SECRET=mX8k9Pq2N5vW7dR3sF6hJ1gC4bL0zY9e
```

### 3. Deploy to Production

```bash
# Deploy to production (cron jobs only work in production)
vercel deploy --prod
```

## ⏰ Cron Schedule

- **Frequency**: Once daily at 9 AM (`0 9 * * *`) - **FREE Hobby Plan Compatible**
- **Path**: `/api/cron/email-reminders`
- **Timezone**: UTC

### **Schedule Options:**
- **Hobby Plan (FREE)**: `0 9 * * *` (once daily at 9 AM UTC)
- **Pro Plan ($20/month)**: `*/5 * * * *` (every 5 minutes for instant delivery)

## 🔍 How It Works

1. **Every day at 9 AM UTC**, Vercel automatically calls `/api/cron/email-reminders`
2. **Checks database** for reminders where `sendAt <= now` and `status = 'pending'`
3. **Sends emails** via Resend to users
4. **Updates status** to `'sent'` in database
5. **Handles retries** (up to 3 attempts for failed emails)

### **📋 Daily Batch Processing:**
- **Processes all due reminders** from the past 24 hours
- **Maximum 25 reminders** per daily run (to prevent timeouts)
- **Reliable delivery** once per day at a consistent time

## 📊 Monitoring

### View Cron Job Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/cron/email-reminders`
3. View execution logs and performance

### Check Cron Job Status
Test your cron job manually:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/email-reminders
```

## 🎯 Expected Response

Successful execution:
```json
{
  "success": true,
  "message": "Processed 5 email reminders",
  "results": {
    "processed": 5,
    "successful": 5,
    "failed": 0
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check CRON_SECRET is set correctly
2. **500 Error**: Check all Appwrite environment variables
3. **No emails sent**: Verify RESEND_API_KEY and user email addresses
4. **Cron not running**: Ensure deployed to production (`--prod`)

### Debug Steps

1. Check Vercel function logs
2. Verify environment variables are set
3. Test API endpoint manually
4. Check Appwrite database permissions

## ✅ Success Indicators

- ✅ Cron job appears in Vercel dashboard
- ✅ Function logs show successful executions
- ✅ Users receive email notifications at scheduled times
- ✅ Database reminder status updates to 'sent'

## 🎉 You're Done!

Your automatic email reminder system is now live and will run 24/7 without any manual intervention! 