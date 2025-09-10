import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⬇️ IMPORTANT: set this to '/<REPO_NAME>/' (leading & trailing slashes)
export default defineConfig({
  base: '/babebattle/',
  plugins: [react()],
})
