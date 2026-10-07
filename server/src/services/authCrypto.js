/**
 * Auth Crypto Service.
 *
 * Provides production-grade cryptographic hashing and verification for user passwords
 * using Node.js crypto (PBKDF2 with SHA-512, 100,000 iterations, unique salts).
 * Offloads heavy CPU work asynchronously so the real-time Socket.IO loop is never blocked.
 */

'use strict';

const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LEN    = 64;
const DIGEST     = 'sha512';

/**
 * Hash a password asynchronously with PBKDF2
 * @param {string} password 
 * @returns {Promise<{ hash: string, salt: string }>}
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve({
        hash: derivedKey.toString('hex'),
        salt,
      });
    });
  });
}

/**
 * Verify a password against a stored hash and salt asynchronously
 * @param {string} password 
 * @param {string} storedHash 
 * @param {string} salt 
 * @returns {Promise<boolean>}
 */
function verifyPassword(password, storedHash, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      const hashAttempt = derivedKey.toString('hex');
      // Constant-time comparison to prevent timing attacks
      const match = crypto.timingSafeEqual(
        Buffer.from(hashAttempt, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
      resolve(match);
    });
  });
}

/**
 * Generate a clean, memorable Unique Player ID.
 * Example: 'UNO-7821' or 'UNO-9X4A'
 * @returns {string}
 */
function generateUniquePlayerId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `UNO-${code}`;
}

/**
 * Generate a random session token
 * @returns {string}
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateUniquePlayerId,
  generateSessionToken,
};
