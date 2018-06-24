#!/bin/sh

set -e

rm -Rf dist && mkdir dist
browserify -t [ babelify --presets [ env react ] ] main.js -o dist/bundle.js
cp index.html dist/index.html
cp node_modules/codemirror/lib/codemirror.css dist/codemirror.css
cp node_modules/codemirror/theme/material.css dist/theme.css

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
