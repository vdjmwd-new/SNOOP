#!/bin/bash
# ──────────────────────────────────────
# SNOOP - 서버 시작 / 종료 스크립트
# ──────────────────────────────────────

PORT=${PORT:-3000}
PID_FILE=".snoop.pid"

start_server() {
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "⚠️  SNOOP 서버가 이미 실행 중입니다 (PID: $OLD_PID)"
      echo "   종료하려면: $0 stop"
      exit 1
    else
      rm -f "$PID_FILE"
    fi
  fi

  echo "🐾 SNOOP 서버를 시작합니다... (포트: $PORT)"
  nohup node server.js > /dev/null 2>&1 &
  echo $! > "$PID_FILE"
  sleep 1

  if kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
    echo "✅ 서버 시작 완료! PID: $(cat $PID_FILE)"
    echo "   브라우저에서 열기: http://localhost:$PORT"
  else
    echo "❌ 서버 시작에 실패했습니다."
    rm -f "$PID_FILE"
    exit 1
  fi
}

stop_server() {
  if [ ! -f "$PID_FILE" ]; then
    echo "⚠️  실행 중인 SNOOP 서버를 찾을 수 없습니다."
    # 포트에서 실행 중인 프로세스 직접 확인
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
      echo "   포트 $PORT에서 프로세스를 발견했습니다 (PID: $PID)"
      kill -9 $PID 2>/dev/null
      echo "✅ 프로세스를 종료했습니다."
    else
      echo "   포트 $PORT에 실행 중인 프로세스가 없습니다."
    fi
    exit 0
  fi

  PID=$(cat "$PID_FILE")
  echo "🛑 SNOOP 서버를 종료합니다... (PID: $PID)"
  kill "$PID" 2>/dev/null
  sleep 1

  if kill -0 "$PID" 2>/dev/null; then
    echo "   강제 종료 중..."
    kill -9 "$PID" 2>/dev/null
  fi

  rm -f "$PID_FILE"
  echo "✅ 서버가 종료되었습니다."
}

restart_server() {
  echo "🔄 SNOOP 서버를 재시작합니다..."
  stop_server
  sleep 1
  start_server
}

show_status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "🟢 SNOOP 서버 실행 중 (PID: $PID, 포트: $PORT)"
      echo "   http://localhost:$PORT"
    else
      echo "🔴 PID 파일은 있지만 서버가 실행되지 않고 있습니다."
      rm -f "$PID_FILE"
    fi
  else
    echo "🔴 SNOOP 서버가 실행되지 않고 있습니다."
  fi
}

# ── 메인 ──
case "${1:-start}" in
  start)   start_server ;;
  stop)    stop_server ;;
  restart) restart_server ;;
  status)  show_status ;;
  *)
    echo "사용법: $0 {start|stop|restart|status}"
    echo ""
    echo "  start    서버 시작 (기본값)"
    echo "  stop     서버 종료"
    echo "  restart  서버 재시작"
    echo "  status   서버 상태 확인"
    exit 1
    ;;
esac
