'use strict';

// Kept only to prevent old operator documentation from silently targeting an
// arbitrary database. Migration 031 is now in the checksum-tracked manifest.
console.error('Deprecated unsafe migration helper. Use npm run migrate:required with confirmed isolated staging credentials.');
process.exit(1);
