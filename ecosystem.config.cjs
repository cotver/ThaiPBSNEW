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
      args: 'start -p 3008',
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
