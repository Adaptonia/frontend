#!/usr/bin/env tsx

/**
 * Appwrite Collection Creation Script for Partner Accountability MVP
 *
 * This script creates all the necessary collections for the partner accountability system
 * Run with: npx tsx scripts/create-partnership-collections.ts
 */

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import { APPWRITE_COLLECTIONS } from '../database/partner-accountability-schema';

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

// Collection creation results
interface CreationResult {
  name: string;
  success: boolean;
  collectionId?: string;
  error?: string;
}

const results: CreationResult[] = [];

async function createCollection(
  collectionKey: keyof typeof APPWRITE_COLLECTIONS,
  config: typeof APPWRITE_COLLECTIONS[keyof typeof APPWRITE_COLLECTIONS]
) {
  try {
    console.log(`\n🔄 Creating collection: ${config.name}...`);

    // Create collection
    const collection = await databases.createCollection(
      APPWRITE_DATABASE_ID,
      ID.unique(),
      config.name,
      [
        Permission.read(Role.any()),
        Permission.write(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ]
    );

    console.log(`✅ Collection created: ${collection.$id}`);

    // Create attributes
    for (const attr of config.attributes) {
      try {
        console.log(`  📝 Adding attribute: ${attr.key} (${attr.type})`);

        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(
              APPWRITE_DATABASE_ID,
              collection.$id,
              attr.key,
              attr.size || 255,
              attr.required || false,
              undefined, // default value
              attr.array || false
            );
            break;

          case 'integer':
            await databases.createIntegerAttribute(
              APPWRITE_DATABASE_ID,
              collection.$id,
              attr.key,
              attr.required || false,
              undefined, // min
              undefined, // max
              undefined, // default
              attr.array || false
            );
            break;

          case 'double':
            await databases.createFloatAttribute(
              APPWRITE_DATABASE_ID,
              collection.$id,
              attr.key,
              attr.required || false,
              undefined, // min
              undefined, // max
              undefined, // default
              attr.array || false
            );
            break;

          case 'boolean':
            await databases.createBooleanAttribute(
              APPWRITE_DATABASE_ID,
              collection.$id,
              attr.key,
              attr.required || false,
              undefined, // default
              attr.array || false
            );
            break;

          case 'datetime':
            await databases.createDatetimeAttribute(
              APPWRITE_DATABASE_ID,
              collection.$id,
              attr.key,
              attr.required || false,
              undefined, // default
              attr.array || false
            );
            break;

          default:
            console.warn(`⚠️  Unknown attribute type: ${attr.type}`);
        }

        // Wait a bit between attributes to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (attrError: unknown) {
        const errorMessage = attrError instanceof Error ? attrError.message : 'Unknown attribute error';
        console.error(`❌ Failed to create attribute ${attr.key}: ${errorMessage}`);
      }
    }

    // Create indexes
    if (config.indexes) {
      for (const index of config.indexes) {
        try {
          console.log(`  🔍 Creating index: ${index.key}`);

          await databases.createIndex(
            APPWRITE_DATABASE_ID,
            collection.$id,
            ID.unique(),
            index.type || 'key',
            [index.key],
            ['ASC']
          );

          // Wait a bit between indexes
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (indexError: unknown) {
          const errorMessage = indexError instanceof Error ? indexError.message : 'Unknown index error';
          console.error(`❌ Failed to create index ${index.key}: ${errorMessage}`);
        }
      }
    }

    results.push({
      name: config.name,
      success: true,
      collectionId: collection.$id
    });

    console.log(`✅ Collection ${config.name} completed successfully!`);

    // Log the environment variable needed
    const envVarName = `NEXT_PUBLIC_APPWRITE_${collectionKey}_COLLECTION_ID`;
    console.log(`📝 Add to .env: ${envVarName}=${collection.$id}`);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to create collection ${config.name}: ${errorMessage}`);

    results.push({
      name: config.name,
      success: false,
      error: errorMessage
    });
  }
}

async function main() {
  console.log('🚀 Starting Partner Accountability Collections Creation...');
  console.log(`📍 Database: ${APPWRITE_DATABASE_ID}`);
  console.log(`🔗 Endpoint: ${APPWRITE_ENDPOINT}`);

  // Create collections in order
  const collections = Object.entries(APPWRITE_COLLECTIONS) as [
    keyof typeof APPWRITE_COLLECTIONS,
    typeof APPWRITE_COLLECTIONS[keyof typeof APPWRITE_COLLECTIONS]
  ][];

  for (const [key, config] of collections) {
    await createCollection(key, config);
    // Wait between collections to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n📊 CREATION SUMMARY');
  console.log('='.repeat(50));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successfully Created Collections:');
    successful.forEach(result => {
      console.log(`  • ${result.name} (ID: ${result.collectionId})`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Collections:');
    failed.forEach(result => {
      console.log(`  • ${result.name}: ${result.error}`);
    });
  }

  // Print environment variables to add
  console.log('\n📝 ENVIRONMENT VARIABLES TO ADD:');
  console.log('='.repeat(50));
  successful.forEach((result, index) => {
    const collectionKeys = Object.keys(APPWRITE_COLLECTIONS);
    const envVarName = `NEXT_PUBLIC_APPWRITE_${collectionKeys[index]}_COLLECTION_ID`;
    console.log(`${envVarName}=${result.collectionId}`);
  });

  console.log('\n🎉 Partner Accountability Collections Creation Complete!');

  if (failed.length > 0) {
    console.log('⚠️  Some collections failed to create. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});