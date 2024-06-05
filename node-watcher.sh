#!/bin/bash
LOG_FILE="./logfile.log"
nohup node ./dist/symbol-node-watcher.js "$@" >> $LOG_FILE 2>&1 &