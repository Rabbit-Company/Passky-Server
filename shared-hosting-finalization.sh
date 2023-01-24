#!/usr/bin/env bash

composer update -d api/
echo '{}' > api/data.json
mkdir api/databases