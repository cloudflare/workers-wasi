#!/bin/bash
set -euxo pipefail

: ${1?' Usage: $0 <version eg. v0.0.1>'}

# git checkout -B release-$1 origin/main

npm --no-git-tag-version version $1

# make sure to update test ./package-lock.json
make -j test

