#!/usr/bin/env bash

rm -rf public/
mkdir public

ln -s ../api/src/index.php public/index.php
ln -s ../api/src/website public/website

echo "{}" > api-limiter.json
echo "{}" > tokens.json
