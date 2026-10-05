/**
 * Supabase client initialization.
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY from environment.
 * If credentials are not supplied, provides a graceful fallback status so the server
 * operates smoothly in local/offline development.
 */

'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let isConfigured = false;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    isConfigured = true;
    console.log('[Database] Supabase client initialized successfully.');
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Database] Supabase URL / Key not set in environment. Running with local persistent in-memory repository.');
}

module.exports = {
  supabase,
  isConfigured,
};
