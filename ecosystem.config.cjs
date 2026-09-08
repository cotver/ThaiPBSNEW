const path = require('path')

const appCwd = process.env.THAIPBSNEW_CWD || path.resolve(__dirname, '.current')

function resolveUploadDir(value, fallback) {
  if (!value) return path.resolve(__dirname, fallback)
  return path.isAbsolute(value) ? value : path.resolve(__dirname, value)
}

const mediaDir = resolveUploadDir(process.env.PAYLOAD_MEDIA_DIR, 'payload-uploads/media')
const videosDir = resolveUploadDir(process.env.PAYLOAD_VIDEOS_DIR, 'payload-uploads/videos')

module.exports = {
  apps: [
    {
      name: 'ThaiPBSNEW',
      cwd: appCwd,
      script: 'node_modules/next/dist/bin/next',
      // Nginx is the only public entry point. Binding Next.js to loopback prevents
      // clients from bypassing Nginx access rules by connecting to port 3008.
      args: 'start -p 3008 -H 127.0.0.1',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '4G',
      node_args: '--max-old-space-size=4096',
      env: {
        NODE_ENV: 'production',
        PORT: '3008',
        PAYLOAD_MEDIA_DIR: mediaDir,
        PAYLOAD_VIDEOS_DIR: videosDir,
      },
    },
  ],
}
