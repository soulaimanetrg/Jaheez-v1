# JAHEEZ active operator documents

These are the active documents to use for local development, staging validation, and production preparation:

- [README.md](../README.md)
- [RUN_APP.md](../RUN_APP.md)
- [DEPLOY.md](../DEPLOY.md)
- [COMMISSION_PRODUCTION_RUNBOOK.md](./COMMISSION_PRODUCTION_RUNBOOK.md)
- [PRODUCTION_READINESS_PLAN.md](./PRODUCTION_READINESS_PLAN.md)
- [PRODUCTION_READINESS_MANIFEST.json](./PRODUCTION_READINESS_MANIFEST.json)
- [backend/.env.staging.local.example](../backend/.env.staging.local.example)
- [.env.example](../.env.example)
- [.env.production.example](../.env.production.example)
- [frontend/user-app/.env.example](../frontend/user-app/.env.example)
- [frontend/driver-app/.env.example](../frontend/driver-app/.env.example)
- [frontend/admin/.env.example](../frontend/admin/.env.example)

Historical audits, generated reports, and old planning documents may mention Stripe, MAD labels, prototype folders, or older architecture. Treat those files as historical context only.

Current operational truth:

- Online card payments are paused.
- Legacy Stripe routes must keep returning `410 Gone`.
- Do not add Stripe secrets to active env files.
- Cash on delivery remains the only active checkout payment method until a Morocco-compatible payment provider is selected, implemented, and validated in staging.
- Application UI shows money in `DH`; integer centimes remain internal to PostgreSQL/backend financial ledgers.
- Production/staging validation requires the full staging signoff flow before any production migration or payout enablement.

Current readiness snapshot command:

```bash
npm run readiness:status
```

This command runs the full local release gate, summarizes staging blockers, and never authorizes production deployment.
