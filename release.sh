#!/bin/bash -e

S3_BUCKET=ryan.govost.es
# Should start with a slash, but not end with one
S3_BUCKET_SUBDIR=/http-translator
CF_DISTRIBUTION=E1PTO4RG80K1VB

rm -Rf dist
npm install
npm run build

SYNC_COMMAND=(
    aws s3 sync
    --delete
    --exclude .DS_Store
    --acl public-read
    dist "s3://${S3_BUCKET}${S3_BUCKET_SUBDIR}"
)

"${SYNC_COMMAND[@]}" --dryrun

read -p "Are you sure? " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Actually run the sync command
SYNC_OUTPUT=$("${SYNC_COMMAND[@]}")

# Invalidate the Cloudfront cache
echo "$SYNC_OUTPUT" \
    | sed -Ee 's,^.*'"$S3_BUCKET"'('"$S3_BUCKET_SUBDIR"'/.*)$,\1,g' \
    | xargs aws cloudfront create-invalidation \
        --distribution-id "$CF_DISTRIBUTION" \
        --paths
