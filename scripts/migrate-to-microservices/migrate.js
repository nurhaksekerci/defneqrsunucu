/**
 * One-time migration: Split monolith defneqr DB into 3 databases
 * - db-common: users, refresh_tokens, password_resets, token_blacklist, support_tickets, ticket_messages, system_settings
 * - db-qr: restaurants, categories, products, orders, order_items, payments, stocks, tables, menu_scans, plans, subscriptions, promo_codes, promo_code_usages, affiliate_*, wheel_*
 * - db-randevu: appointment_* tables
 *
 * Prerequisites:
 * 1. Run init-multiple-databases.sh (or create defneqr_common, defneqr_qr, defneqr_randevu manually)
 * 2. Run prisma migrate for backend-common, backend-qr, backend-randevu (each with its DATABASE_URL)
 * 3. Set SOURCE_DATABASE_URL (defneqr) and target URLs
 *
 * Usage: SOURCE_DATABASE_URL=... DATABASE_URL_COMMON=... DATABASE_URL_QR=... DATABASE_URL_RANDEVU=... node migrate.js
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SOURCE = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const COMMON = process.env.DATABASE_URL_COMMON || SOURCE?.replace(/\/defneqr([?/]|$)/, '/defneqr_common$1');
const QR = process.env.DATABASE_URL_QR || SOURCE?.replace(/\/defneqr([?/]|$)/, '/defneqr_qr$1');
const RANDEVU = process.env.DATABASE_URL_RANDEVU || SOURCE?.replace(/\/defneqr([?/]|$)/, '/defneqr_randevu$1');

async function copyTable(sourceClient, targetClient, tableName) {
  const res = await sourceClient.query(`SELECT * FROM ${tableName}`);
  if (res.rows.length === 0) {
    console.log(`  ${tableName}: 0 rows`);
    return 0;
  }
  const colNames = res.fields.map(f => `"${f.name}"`).join(', ');
  const placeholders = res.fields.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  for (const row of res.rows) {
    const values = res.fields.map(f => row[f.name]);
    try {
      await targetClient.query(insertSql, values);
    } catch (e) {
      if (e.code === '23505') continue; // unique violation, skip
      throw e;
    }
  }
  console.log(`  ${tableName}: ${res.rows.length} rows`);
  return res.rows.length;
}

async function run() {
  if (!SOURCE) {
    console.error('Set SOURCE_DATABASE_URL or DATABASE_URL');
    process.exit(1);
  }

  const source = new Client({ connectionString: SOURCE });
  const common = new Client({ connectionString: COMMON });
  const qr = new Client({ connectionString: QR });
  const randevu = new Client({ connectionString: RANDEVU });

  try {
    await source.connect();
    await common.connect();
    await qr.connect();
    await randevu.connect();

    console.log('\n=== Migrating to db-common ===');
    const commonTables = ['users', 'refresh_tokens', 'password_resets', 'token_blacklist', 'system_settings'];
    for (const t of commonTables) {
      await copyTable(source, common, t);
    }
    await copyTable(source, common, 'support_tickets');
    await copyTable(source, common, 'ticket_messages');

    console.log('\n=== Migrating to db-qr ===');
    const qrTables = [
      'restaurants', 'categories', 'products', 'stocks', 'tables', 'order_items', 'orders', 'payments',
      'menu_scans', 'plans', 'subscriptions', 'promo_codes', 'promo_code_usages',
      'affiliate_partners', 'referrals', 'affiliate_commissions', 'affiliate_payouts', 'affiliate_settings',
      'wheel_game_settings', 'wheel_spins'
    ];
    for (const t of qrTables) {
      try {
        await copyTable(source, qr, t);
      } catch (e) {
        if (e.message?.includes('does not exist')) console.log(`  ${t}: table not in source, skipped`);
        else throw e;
      }
    }

    console.log('\n=== Migrating to db-randevu ===');
    const randevuTables = [
      'appointment_businesses', 'appointment_staff', 'appointment_services', 'appointment_staff_services',
      'appointment_working_hours', 'appointment_customers', 'appointments', 'appointment_sms_logs',
      'appointment_reminders', 'finance_entries', 'receivables', 'receivable_payments',
      'customer_packages', 'package_usages', 'appointment_products', 'product_sales'
    ];
    for (const t of randevuTables) {
      try {
        await copyTable(source, randevu, t);
      } catch (e) {
        if (e.message?.includes('does not exist')) console.log(`  ${t}: table not in source, skipped`);
        else throw e;
      }
    }

    console.log('\nMigration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await source.end();
    await common.end();
    await qr.end();
    await randevu.end();
  }
}

run();
