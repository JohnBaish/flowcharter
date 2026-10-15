import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The chart layout library (elkjs, ~1.4 MB, ~440 KB compressed) is its own
    // file, loaded only when a chart is first drawn (src/lib/layout.ts), so its
    // size doesn't slow the List or Library. Raised so that expected size isn't
    // reported as a warning on every build.
    chunkSizeWarningLimit: 1500,
  },
})
