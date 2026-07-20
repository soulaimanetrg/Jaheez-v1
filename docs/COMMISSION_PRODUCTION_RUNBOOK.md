# Commission production runbook

## Hard gates

- Never run the staging scripts unless `JAHEEZ_TARGET_ENV=staging`, `STAGING_CONFIRM_ISOLATED=true`, and staging/production URLs differ.
- Keep payouts disabled globally. Only dedicated internal driver UUIDs may be added to `commission_internal_driver_allowlist` during staging or a production pilot.
- Do not deploy while reconciliation reports any unresolved discrepancy or any high/critical security test fails.
- Never delete or rewrite ledger history. Rollback means disabling payout transitions and new cohort expansion.

## Staging rehearsal

1. Disable outbound SMS, push, live payment gateways, webhooks, email, and scheduled production integrations in the staging project.
2. Run `npm run staging:init-env` from the repository root to create/repair the ignored private staging env file, generate local backup/signing secrets, and list missing external fields without printing secrets.
3. Run `npm run staging:access-pack` to print the non-secret list of missing credentials, fixture IDs, and Android device requirements. It is safe to share because it never prints actual secrets.
4. Run `npm run readiness:status` from the repository root to confirm local gates are green and see the remaining staging blockers.
5. Run `npm run staging:preflight` and resolve every failed check before touching production or staging data.
6. Run `npm run staging:full` to execute the complete staging sequence: encrypted backup, restore, migrations twice, local builds/tests, staging validation, security matrix, E2E, reconciliation, and device readiness.
7. Archive the generated staging signoff JSON from `STAGING_SIGNOFF_DIR` or the reported temp path. It records every gate, exit status, backup path, and HMAC signature when `REPORT_SIGNING_KEY` is present.
8. Verify the signoff before production approval:

   ```bash
   npm run staging:verify-signoff -- <path-to-staging-full-report.json>
   ```

   The verifier must return `ok: true`, `production_deployment: false`, zero failed gates, and a non-empty backup path.
9. Store the encrypted backup artifact and SHA-256 file in restricted storage. Delete both after 30 days.
10. Record customer and driver Android device/build identifiers with the test evidence.

## Device acceptance

- Customer: registration, DH totals, checkout retry, offline recovery, tracking, refund visibility, and notifications.
- Driver: login-only authentication, shift lifecycle, confirmation retries, DH earnings, reliability history, corrected incidents, offline recovery, and no payout request capability.
- Admin browser: commission history, resolved rates, COD settlement, approval/payment idempotency, refund reversal, fraud cases, and partner reliability.

## Production order (requires separate approval)

1. Verified backup; migrations; backend; admin; driver; customer.
2. Run historical reconciliation before allowing any payout.
3. Add internal test drivers to the allowlist, observe for 48 hours, then expand to 5%, 25%, and 100% only when all monitoring queries remain clean.
4. Expansion stops on any duplicate reference, ledger mismatch, COD mismatch, unexplained reversal, failed financial RPC, or critical fraud alert.

## Monitoring and rollback

- Monitor `commission_monitoring_summary`, open `reconciliation_issues`, open/confirmed `fraud_cases`, failed RPC logs, duplicate references, and reliability corrections.
- On incident, set `commission_payouts_enabled=false`, clear the allowlist, stop cohort expansion, and preserve all ledger/audit history.
- Never downgrade by deleting migrations, financial rows, reversals, or point events.
