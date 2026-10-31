# Deploying FinSuraksha

FinSuraksha is one Node.js process that stores its data in a folder (`DATA_DIR`). Whichever host you use, two things matter:

1. **The data folder must be on a persistent disk.** If it isn't, every redeploy wipes all accounts and reports.
2. **Run exactly one instance.** The data store lives in memory and is written to `db.json`. Two instances would overwrite each other's changes.

## Settings for a real launch

```env
NODE_ENV=production
PUBLIC_URL=https://your-domain.example
COOKIE_SECURE=true
TRUST_PROXY=1
SEED_DEMO=false
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-long-password-1     # remove after the first start
CONTACT_EMAIL=grievance@your-domain.example
# optional
GROQ_API_KEY=
GOOGLE_SAFE_BROWSING_API_KEY=
```

`SEED_DEMO=false` matters: without it, the first start loads sample hunters and reports. If sample data has already been loaded, stop the server, delete `DATA_DIR/db.json` and start again.

## Option A — a VPS (recommended) with Caddy for HTTPS

```bash
# Ubuntu 22.04+, Node 20
git clone <repo> /opt/finsuraksha && cd /opt/finsuraksha
npm ci --omit=dev
cp .env.example .env    # fill in the settings above, plus DATA_DIR=/var/lib/finsuraksha
```

Create `/etc/systemd/system/finsuraksha.service`:

```ini
[Unit]
Description=FinSuraksha
After=network.target

[Service]
WorkingDirectory=/opt/finsuraksha
ExecStart=/usr/bin/node server.js
Restart=always
User=www-data
Environment=HOST=127.0.0.1

[Install]
WantedBy=multi-user.target
```

Then give `www-data` the data folder (`mkdir -p /var/lib/finsuraksha && chown www-data /var/lib/finsuraksha`) and run `systemctl enable --now finsuraksha`.

Add this to `/etc/caddy/Caddyfile` (Caddy gets the HTTPS certificate on its own):

```
your-domain.example {
    reverse_proxy 127.0.0.1:3000
}
```

## Option B — Docker

```bash
docker build -t finsuraksha .
docker run -d --name finsuraksha --restart unless-stopped \
  -p 127.0.0.1:3000:3000 -v finsuraksha-data:/data --env-file .env finsuraksha
```

Put Caddy or nginx in front for HTTPS, as in option A.

## Option C — Render or Railway

- Build `npm ci --omit=dev`, start `node server.js`.
- **Attach a persistent disk/volume** mounted at `/data` and set `DATA_DIR=/data`. Without one, data is lost on every deploy.
- Set the environment variables above. Both platforms run behind a proxy, so keep `TRUST_PROXY=1`.
- Health check path: `/api/health`.

## After deploying

- Open `https://your-domain.example/api/health`. It should return `{"ok":true,"app":"finsuraksha"}`.
- Sign in with `ADMIN_EMAIL`, then remove `ADMIN_PASSWORD` from the environment.
- A moderator password can only be changed on the server: `node scripts/set-password.mjs <email>`.
- Backups: a copy of `db.json` is saved to `DATA_DIR/backups` every day and the last 7 are kept. Copy that folder off the server from time to time.
- Logs: the server logs errors to stdout. Set `LOG_REQUESTS=true` to also log each request.
- The SEBI register snapshot shows a warning once it is more than 90 days old. Refresh it with `npm run import-register`.
