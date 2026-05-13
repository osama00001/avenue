#!/usr/bin/env bash
# setup-cron.sh
# Installs Avenue Bookstore cron jobs for the Gardners sync pipeline.
#
# Run as root on the Plesk server:
#   bash /var/www/vhosts/avenuebookstore.com/httpdocs/src/scripts/setup-cron.sh
#
# Schedule:
#   sync-biblio.js     Sunday 02:00  — weekly Panda XML catalog delta
#   sync-inventory.js  Daily  05:00  — P&A price/stock update
#   sync-avail.js      Daily  05:30  — availability flag cleanup
#   sync-covers.js     Sunday 03:00  — cover image delta (after biblio)

set -e

SITE_USER="elegant-curie_i0sktsd7ty"
HTTPDOCS="/var/www/vhosts/avenuebookstore.com/httpdocs"
NODE="/var/www/vhosts/avenuebookstore.com/.nodenv/shims/node"
LOG_DIR="/var/log/avenue"
ENV_FILE="$HTTPDOCS/.env.local"

# ── Preflight checks ─────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root" >&2
  exit 1
fi

if [ ! -x "$NODE" ]; then
  echo "ERROR: node not found at $NODE" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found" >&2
  exit 1
fi

# ── Log directory ─────────────────────────────────────────────────────────────
mkdir -p "$LOG_DIR"
chown "$SITE_USER" "$LOG_DIR"
echo "Log directory: $LOG_DIR"

# ── Build crontab entries ────────────────────────────────────────────────────
CRON_CMD="$NODE --env-file=$ENV_FILE"
CRON_DIR="cd $HTTPDOCS &&"

BIBLIO_JOB="0 2 * * 0  $CRON_DIR $CRON_CMD src/scripts/sync-biblio.js     >> $LOG_DIR/sync-biblio.log     2>&1"
INVENT_JOB="0 5 * * *  $CRON_DIR $CRON_CMD src/scripts/sync-inventory.js  >> $LOG_DIR/sync-inventory.log  2>&1"
AVAIL_JOB="30 5 * * *  $CRON_DIR $CRON_CMD src/scripts/sync-avail.js      >> $LOG_DIR/sync-avail.log      2>&1"
COVERS_JOB="0 3 * * 0  $CRON_DIR $CRON_CMD src/scripts/sync-covers.js     >> $LOG_DIR/sync-covers.log     2>&1"

# ── Install (preserving any existing crontab entries) ────────────────────────
TMPFILE=$(mktemp)

# Export current crontab (ignore error if empty)
crontab -u "$SITE_USER" -l 2>/dev/null | grep -v "sync-biblio\|sync-inventory\|sync-avail\|sync-covers" > "$TMPFILE" || true

# Append new jobs
cat >> "$TMPFILE" << EOF

# Avenue Bookstore — Gardners sync pipeline (installed by setup-cron.sh)
$BIBLIO_JOB
$INVENT_JOB
$AVAIL_JOB
$COVERS_JOB
EOF

crontab -u "$SITE_USER" "$TMPFILE"
rm "$TMPFILE"

echo ""
echo "Cron jobs installed for $SITE_USER:"
crontab -u "$SITE_USER" -l | grep "sync-"
echo ""
echo "Logs will appear in $LOG_DIR/"
echo "Done."
