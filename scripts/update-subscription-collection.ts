#!/usr/bin/env tsx

/**
 * Update Subscriptions Collection Script
 * Adds missing attributes and indexes
 */

import { Client, Databases, IndexType } from 'node-appwrite';

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function updateCollection() {
  try {
    console.log('\n🔄 Updating Subscriptions Collection...\n');

    const collectionId = 'subscriptions';

    // Add missing attributes
    const missingAttributes = [
      { key: 'currency', type: 'string', size: 10, required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ];

    console.log('📝 Adding missing attributes...');
    for (const attr of missingAttributes) {
      try {
        console.log(`  Adding: ${attr.key} (${attr.type})`);

        if (attr.type === 'string') {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            attr.size || 255,
            attr.required || false
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            collectionId,
            attr.key,
            attr.required || false
          );
        }

        console.log(`  ✅ Added ${attr.key}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ℹ️  Attribute ${attr.key} already exists`);
        } else {
          console.error(`  ❌ Failed to add ${attr.key}:`, error.message);
        }
      }
    }

    console.log('\n⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Create indexes
    console.log('\n📇 Creating indexes...');
    const indexes = [
      { key: 'userId', type: IndexType.Key },
      { key: 'status', type: IndexType.Key },
      { key: 'paymentReference', type: IndexType.Unique },
      { key: 'endDate', type: IndexType.Key },
    ];

    for (const index of indexes) {
      try {
        console.log(`  Creating index: ${index.key} (${index.type})`);
        await databases.createIndex(
          APPWRITE_DATABASE_ID,
          collectionId,
          index.key,
          index.type,
          [index.key]
        );
        console.log(`  ✅ Created ${index.key} index`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`  ℹ️  Index ${index.key} already exists`);
        } else {
          console.error(`  ❌ Failed to create index ${index.key}:`, error.message);
        }
      }
    }

    console.log('\n✅ Collection updated successfully!');

  } catch (error: any) {
    console.error('\n❌ Error updating collection:', error.message);
    process.exit(1);
  }
}

updateCollection();
