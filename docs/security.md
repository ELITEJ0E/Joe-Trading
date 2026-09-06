# Security, Authentication & Deployment

## Security Principles:
- **Server-Side Key Isolation**: Gemini API and third-party broker keys are strictly isolated in `server.ts`. No secrets sent to browser.
- **RBAC**: Enforces roles: `TRADER`, `RISK_OFFICER`, `BOT_SERVICE`, `AUDITOR`.
- **Append-Only Auditing**: Every login, order, risk rule change, and kill switch action is immutable.
- **Input Validation**: Strict typing on all REST parameters.
- **Idempotency**: All order creation and bot event calls accept client correlation IDs.

## Production Deployment:
- Full-stack containerized on Cloud Run with port 3000 ingress.
- Built via `npm run build` (`vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`).
- Booted via `node dist/server.cjs`.
