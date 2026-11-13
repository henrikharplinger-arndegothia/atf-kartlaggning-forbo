#!/bin/sh
# Builds dist/ (static files only) and deploys page + functions to Cloudflare Pages.
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
cp -R index.html atf-fragor.html vendor dist/
npx --yes wrangler@4 pages deploy dist --project-name atf-check-forbo --branch main --commit-dirty=true
