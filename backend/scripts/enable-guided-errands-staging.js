require('dotenv').config({ path: '.env.staging.local' });

const { Client } = require('pg');

async function main() {
  if (process.env.JAHEEZ_TARGET_ENV !== 'staging' || process.env.STAGING_CONFIRM_ISOLATED !== 'true') {
    throw new Error('Refusing to change a non-isolated staging environment.');
  }

  const client = new Client({
    connectionString: process.env.STAGING_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const result = await client.query({
      text: `
        UPDATE public.app_settings
        SET value = CASE WHEN key = $1 THEN $2 ELSE $3 END
        WHERE key = ANY($4::text[])
        RETURNING key, value
      `,
      values: [
        'feature_guided_errands_enabled',
        'true',
        'false',
        ['feature_guided_errands_enabled', 'feature_errand_buy_enabled'],
      ],
    });

    if (result.rowCount !== 2) throw new Error('Both errand feature flags must exist.');
    console.log(JSON.stringify({
      ok: true,
      environment: 'staging',
      flags: result.rows.sort((a, b) => a.key.localeCompare(b.key)),
    }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
