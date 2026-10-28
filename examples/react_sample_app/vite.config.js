/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react()],
  // The library is linked from ../.. (file:), so its own imports of React
  // would resolve from the repository root, which has no React.
  resolve: {dedupe: ['react', 'react-dom']},
});
