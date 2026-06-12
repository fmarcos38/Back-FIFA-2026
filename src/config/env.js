const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')

  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  lines.forEach((line) => {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) return

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex === -1) return

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}

module.exports = { loadEnv }
