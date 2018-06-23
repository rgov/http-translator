#!/bin/sh

set -e

rm -Rf dist && mkdir dist
browserify main.js -o dist/bundle.js
cp index.html dist/index.html

if [ "$1" == "serve" ]; then
  cd dist
  case "$(python --version 2>&1)" in
  "Python "2.*)
    python -m SimpleHTTPServer
    ;;
  "Python "[3-9].*)
    python -m http.server
    ;;
  *)
    echo "Unexpected Python version, cannot serve" >&2
    exit 1
    ;;
  esac
fi
