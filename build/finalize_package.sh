#!/bin/bash

# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================

# Stop at the first failed command. The find calls end with `{} +`, not `\;`,
# so that a failed cp or sed makes find itself fail.
set -e

# Copy README files from src to the lib directory and keep file structure.
cd src
find . -type f -name 'README.md' -exec sh -c '
  for f; do
    mkdir -p "../lib/${f%/*}" && cp "${f}" "../lib/${f}" || exit 1
  done' sh {} +
cd ..

# `sed -i.bak` works with both GNU and BSD sed; the backups are removed below.
find ./lib/base -type f -name 'constants.*' -exec sed -i.bak 's/GIT/NPM/g' {} +
find ./lib -type f -name '*.md' -exec sed -i.bak 's/utm_source=github/utm_source=npm/g' {} +
find ./lib -type f -name '*.js' -exec sed -i.bak 's/utm_source=github/utm_source=npm/g' {} +
sed -i.bak 's/utm_source=github/utm_source=npm/g' 'README.md'
find ./lib -type f -name '*.bak' -exec rm {} +
rm README.md.bak
