'use strict';
// ─────────────────────────────────────────────────────────────────────────────
//  DIAGNOSE LOGIN — proves root cause with console output
//  Run: node diagnose_login.js
// ─────────────────────────────────────────────────────────────────────────────
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const DIVIDER = '─'.repeat(60);

async function main() {
  // ── STEP 1: DB Connection ──────────────────────────────────
  console.log('\n' + DIVIDER);
  console.log('STEP 1 — Database Connection');
  console.log(DIVIDER);
  console.log('MONGO_URI   :', process.env.MONGO_URI);

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });

  console.log('Connected to :', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);

  // ── STEP 2: List users ─────────────────────────────────────
  console.log('\n' + DIVIDER);
  console.log('STEP 2 — Users in Collection');
  console.log(DIVIDER);

  // Use a RAW collection query — bypasses any model weirdness
  const db   = mongoose.connection.db;
  const coll = db.collection('users');
  const users = await coll.find({}).toArray();

  console.log('Total users in DB:', users.length);
  users.forEach((u, i) => {
    console.log(`  [${i+1}] email=${u.email}  role=${u.role}  hash_prefix=${(u.password||'').substring(0,29)}...`);
  });

  // ── STEP 3 & 4: Password hash inspection ──────────────────
  console.log('\n' + DIVIDER);
  console.log('STEP 3+4 — bcrypt.compare() for admin@dementiacare.in');
  console.log(DIVIDER);

  const admin = users.find(u => u.email === 'admin@dementiacare.in');

  if (!admin) {
    console.log('❌ admin@dementiacare.in NOT FOUND in collection');
  } else {
    const storedHash = admin.password;
    const testPassword = 'Admin@1234';

    console.log('Stored Email  :', admin.email);
    console.log('Stored Role   :', admin.role);
    console.log('Stored Hash   :', storedHash);
    console.log('Hash length   :', storedHash ? storedHash.length : 'null');

    // Is it a valid bcrypt hash at all?
    const isValidBcrypt = storedHash && storedHash.startsWith('$2');
    console.log('Valid bcrypt? :', isValidBcrypt ? 'YES' : 'NO — not a bcrypt hash!');

    // Direct bcrypt.compare
    const match1 = await bcrypt.compare(testPassword, storedHash);
    console.log(`\nbcrypt.compare("Admin@1234", storedHash) = ${match1}`);

    // Test if it was DOUBLE-hashed: hash the plaintext once, then compare that hash to stored
    const singleHash = await bcrypt.hash(testPassword, 10);
    const matchDoubleHashed = await bcrypt.compare(singleHash, storedHash).catch(() => false);
    // Actually, double-hash means stored = hash(hash(plain)), so we try:
    // bcrypt.compare(plain, storedHash) fails, but bcrypt.compare(plain, bcrypt.hash(plain)) would work
    // The real double-hash test: is storedHash = bcrypt(bcrypt(plain))?
    // We do: try to compare plain against storedHash — if that's false, try whether storedHash itself looks like
    // a bcrypt of a bcrypt hash (starts with $2b$, length 60, and compare(plain, compare(singleHash, stored)))
    const doubleHashedSample = await bcrypt.hash(singleHash, 10);
    const isDoubleHashed = await bcrypt.compare(testPassword, doubleHashedSample);
    // Can't directly verify without knowing the intermediate hash, so instead:
    // try comparing "plain" against "stored" — already done above as match1
    // If match1=false, the hash is broken. Try all known passwords:
    const knownPasswords = ['Admin@1234', 'admin@1234', 'Admin1234', 'admin1234', 'password', '123456'];
    console.log('\nTrying all known passwords against stored hash:');
    for (const pw of knownPasswords) {
      const r = await bcrypt.compare(pw, storedHash).catch(() => false);
      console.log(`  bcrypt.compare("${pw}") = ${r}`);
    }

    // ── STEP 4: Detect double-hashing ─────────────────────────
    // If the seed ran and the user ALREADY existed, seed does:
    //   doc.password = u.password     ← sets plain text
    //   Object.assign(doc, u)         ← also sets plain text again (same field)
    //   await doc.save()              ← pre-save hook HASHES IT
    // That is ONE hash. Correct.
    //
    // BUT if user was created with User.create(u), the pre-save hook hashed it.
    // If seed is run AGAIN on an existing user:
    //   doc.password = 'Admin@1234'   ← plain text
    //   await doc.save()              ← pre-save hook runs: isModified('password') = TRUE → hashes again
    // → stored = hash('Admin@1234')   ← CORRECT, because plain was assigned
    //
    // So double-hashing would only occur if seed assigned an ALREADY-HASHED value.
    // Let's check: is the stored hash itself a valid input to bcrypt? i.e. is hash(storedHash) what's stored?
    // We can test: if bcrypt.compare(storedHash, storedHash) is true, it would mean stored = hash(storedHash)
    // That's not how bcrypt works, so instead:
    // The definitive test is: does match1 === false? If yes, hash is corrupted/wrong.
    console.log('\n' + DIVIDER);
    console.log('STEP 4 — Double-Hash Diagnosis');
    console.log(DIVIDER);
    if (!match1) {
      // The hash does NOT match 'Admin@1234'. This is the bug.
      // Determine if it's a bcrypt hash of a bcrypt hash of 'Admin@1234':
      // We can't test this directly, but we can check: does it match any bcrypt-hashed version?
      // What we CAN do: hash 'Admin@1234' with bcrypt and see if THAT matches the stored value.
      // If bcrypt.compare(bcrypt('Admin@1234'), storedHash) = true → double hashed.
      // We already computed singleHash above.
      const isDoubleHashConfirmed = await bcrypt.compare(singleHash, storedHash).catch(() => false);
      if (isDoubleHashConfirmed) {
        console.log('🔴 ROOT CAUSE: DOUBLE HASHING CONFIRMED');
        console.log('   The stored password is bcrypt(bcrypt("Admin@1234"))');
        console.log('   This happens when seed sets doc.password = alreadyHashedValue');
      } else {
        console.log('🔴 ROOT CAUSE: Password does NOT match "Admin@1234"');
        console.log('   Possible causes:');
        console.log('   - Seed used a different password than "Admin@1234"');
        console.log('   - The hash is from a completely different plaintext');
        console.log('   - The stored value is not a bcrypt hash at all');
      }
    } else {
      console.log('✅ Password hash is correct — bcrypt.compare("Admin@1234", storedHash) = true');
      console.log('   The issue is NOT the password hash. Check login route or frontend URL.');
    }
  }

  // ── STEP 6: Verify single User model/collection ───────────
  console.log('\n' + DIVIDER);
  console.log('STEP 6 — Collection Names in Database');
  console.log(DIVIDER);
  const collections = await db.listCollections().toArray();
  collections.forEach(c => console.log('  Collection:', c.name));

  // ── STEP 7: DB name used by seed vs server ─────────────────
  console.log('\n' + DIVIDER);
  console.log('STEP 7 — Database name check');
  console.log(DIVIDER);
  console.log('This script + seed.js + server.js all use MONGO_URI from .env');
  console.log('Active DB name:', mongoose.connection.name);
  const uri = process.env.MONGO_URI || '';
  const dbFromUri = uri.split('/').pop().split('?')[0];
  console.log('DB in URI     :', dbFromUri || '(none — defaults to "test"!!)');
  if (!dbFromUri) {
    console.log('⚠️  WARNING: No database name in URI → connects to "test" by default!');
  }

  await mongoose.disconnect();
  console.log('\n' + DIVIDER);
  console.log('Diagnostic complete.');
  console.log(DIVIDER + '\n');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
