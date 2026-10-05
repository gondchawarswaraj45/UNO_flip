/**
 * Automated Database Migration Runner for Supabase PostgreSQL
 *
 * Executes pending SQL migrations in server/src/db/migrations/ against PostgreSQL.
 * Tracks executed migrations in the `public._migrations` table.
 *
 * Usage:
 *   npm run migrate
 *
 * Environment:
 *   DATABASE_URL or SUPABASE_DB_URL or POSTGRES_URL in server/.env
 */

'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

async function runMigrations() {
  console.log('\n=============================================================');
  console.log('       UNO Flip — Automated Database Migration Runner        ');
  console.log('=============================================================\n');

  if (!DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not configured in server/.env\n');
    console.log('To connect your Supabase PostgreSQL instance:');
    console.log('  1. Navigate to your Supabase Dashboard -> Project Settings -> Database');
    console.log('  2. Copy the Connection String (URI mode) under "Connection string"');
    console.log('     Example: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
    console.log('     Or Transaction Pooler (port 6543):');
    console.log('     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres');
    console.log('  3. Open server/.env and add:');
    console.log('     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
    console.log('  4. Re-run: npm run migrate\n');
    process.exit(1);
  }

  // Create PostgreSQL client with SSL enabled (mandatory for Supabase)
  const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('[Migration] Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✅ [Migration] Connected successfully.\n');

    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM public._migrations');
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Scan migrations directory
    const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`[Migration] Warning: Directory not found: ${migrationsDir}`);
      await client.end();
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('[Migration] No SQL migration files found.');
      await client.end();
      return;
    }

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        console.log(`⏩ [Migration] Skipped (already applied): ${file}`);
        continue;
      }

      console.log(`▶️  [Migration] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute within transaction
      await client.query('BEGIN');
      try {
        await client.query(sqlContent);
        await client.query('INSERT INTO public._migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ [Migration] Successfully applied: ${file}\n`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [Migration] Failed executing ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('\n✨ Database schema is fully up to date. No pending migrations.');
    } else {
      console.log(`\n🎉 Successfully applied ${appliedCount} migration(s). Database is ready!`);
    }

    await client.end();
  } catch (error) {
    console.error('\n❌ [Migration] Migration process aborted due to an error:');
    console.error(error.message);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

runMigrations();
