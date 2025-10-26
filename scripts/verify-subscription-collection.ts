#!/usr/bin/env tsx

/**
 * Verify Subscriptions Collection Script
 * Checks if the subscriptions collection exists and shows its structure
 */

import { Client, Databases } from 'node-appwrite';

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

async function verifyCollection() {
  try {
    console.log('\n🔍 Checking Subscriptions Collection...\n');

    const collection = await databases.getCollection(
      APPWRITE_DATABASE_ID,
      'subscriptions'
    );

    console.log('✅ Collection found!');
    console.log(`\n📋 Collection Details:`);
    console.log(`   ID: ${collection.$id}`);
    console.log(`   Name: ${collection.name}`);
    console.log(`   Created: ${collection.$createdAt}`);
    console.log(`   Updated: ${collection.$updatedAt}`);

    console.log('\n📝 Attributes:');
    const attributes = await databases.listAttributes(
      APPWRITE_DATABASE_ID,
      'subscriptions'
    );

    if (attributes.total > 0) {
      attributes.attributes.forEach((attr: any) => {
        console.log(`   - ${attr.key} (${attr.type}) ${attr.required ? '[required]' : ''}`);
      });
    } else {
      console.log('   No attributes found');
    }

    console.log('\n📇 Indexes:');
    const indexes = await databases.listIndexes(
      APPWRITE_DATABASE_ID,
      'subscriptions'
    );

    if (indexes.total > 0) {
      indexes.indexes.forEach((index: any) => {
        console.log(`   - ${index.key} (${index.type})`);
      });
    } else {
      console.log('   No indexes found');
    }

    console.log('\n✅ Collection is ready to use!');
    console.log(`\n🔑 Use this in your .env:`);
    console.log(`NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=${collection.$id}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 404) {
      console.log('\n💡 Collection does not exist. Run create-subscription-collection.ts first.');
    }
    process.exit(1);
  }
}

verifyCollection();
