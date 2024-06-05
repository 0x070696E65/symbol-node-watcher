#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
LOG_FILE="$SCRIPT_DIR/logfile.log"
nohup node $SCRIPT_DIR/dist/symbol-node-watcher.js "$@" >> $LOG_FILE 2>&1 &