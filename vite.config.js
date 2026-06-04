import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function leadListIndexPlugin() {
  function generateIndex() {
    const dir = resolve(__dirname, 'public/lead_lists')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const files = readdirSync(dir)
      .filter(f => f.endsWith('.json') && f !== 'index.json')
      .sort()
    writeFileSync(resolve(dir, 'index.json'), JSON.stringify(files, null, 2))
  }

  return {
    name: 'lead-list-index',
    buildStart: generateIndex,
    configureServer(server) {
      generateIndex()
      server.watcher.add(resolve(__dirname, 'public/lead_lists'))
      server.watcher.on('add', (p) => { if (p.includes('lead_lists')) generateIndex() })
      server.watcher.on('unlink', (p) => { if (p.includes('lead_lists')) generateIndex() })
    },
  }
}

export default defineConfig({
  plugins: [react(), leadListIndexPlugin()],
})
