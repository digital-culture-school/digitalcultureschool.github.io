#!/usr/bin/env bash
set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$APP_DIR/deploy/logs"
PID_DIR="$APP_DIR/deploy/pids"
PORT="${PORT:-5008}"

mkdir -p "$LOG_DIR" "$PID_DIR"

if [ -f "$PID_DIR/server.pid" ]; then
  OLD_PID=$(cat "$PID_DIR/server.pid" 2>/dev/null || true)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Stopping existing server (PID $OLD_PID)"
    kill "$OLD_PID" || true
    sleep 1
  fi
fi

cd "$APP_DIR"
nohup npm start > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_DIR/server.pid"

echo "Digital Culture Schools started on port $PORT with PID $SERVER_PID"
