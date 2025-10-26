#!/usr/bin/env tsx

/**
 * Appwrite Collection Creation Script for Subscriptions
 *
 * This script creates the subscriptions collection for payment management
 * Run with: npx tsx scripts/create-subscription-collection.ts
 */

import { Client, Databases, ID, Permission, Role, IndexType } from 'node-appwrite';

// Environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY!;
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('❌ Missing required environment variables');
  console.error('Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID');
  process.exit(1);
}

// Initialize Appwrite
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function createSubscriptionsCollection() {
  try {
    console.log('\n🚀 Creating Subscriptions Collection...\n');

    // Create collection
    console.log('🔄 Creating collection: subscriptions...');
    const collection = await databases.createCollection(
      APPWRITE_DATABASE_ID,
      'subscriptions', // Using 'subscriptions' as ID
      'subscriptions',
      [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log(`✅ Collection created: ${collection.$id}\n`);

    // Wait for collection to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create attributes
    const attributes = [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'plan', type: 'string', size: 50, required: true },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'amount', type: 'integer', required: true },
      { key: 'currency', type: 'string', size: 10, required: true },
      { key: 'paymentReference', type: 'string', size: 255, required: true },
      { key: 'paymentChannel', type: 'string', size: 50, required: true },
      { key: 'startDate', type: 'datetime', required: true },
      { key: 'endDate', type: 'datetime', required: true },
      { key: 'autoRenew', type: 'boolean', required: true },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ];

    for (const attr of attributes) {
      try {
        console.log(`📝 Adding attribute: ${attr.key} (${attr.type})`);

        if (attr.type === 'string') {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            collection.$id,
            attr.key,
            attr.size || 255,
            attr.required || false
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            APPWRITE_DATABASE_ID,
            collection.$id,
            attr.key,
            attr.required || false
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            APPWRITE_DATABASE_ID,
            collection.$id,
            attr.key,
            attr.required || false
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            collection.$id,
            attr.key,
            attr.required || false
          );
        }

        // Wait between attribute creations
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        console.error(`  ❌ Failed to create attribute ${attr.key}:`, error.message);
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
        console.log(`  📇 Creating index: ${index.key} (${index.type})`);
        await databases.createIndex(
          APPWRITE_DATABASE_ID,
          collection.$id,
          index.key,
          index.type,
          [index.key]
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`  ❌ Failed to create index ${index.key}:`, error.message);
      }
    }

    console.log('\n✅ Subscriptions collection created successfully!');
    console.log(`\n📋 Collection ID: ${collection.$id}`);
    console.log('\n🎉 Add this to your .env file:');
    console.log(`NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=${collection.$id}`);

  } catch (error: any) {
    console.error('\n❌ Error creating collection:', error.message);
    if (error.code === 409) {
      console.log('\n💡 Collection already exists. You can use the existing one.');
    }
    process.exit(1);
  }
}

// Run the script
createSubscriptionsCollection();
