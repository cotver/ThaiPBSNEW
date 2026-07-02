const path = require('path')

const appCwd = process.env.THAIPBSNEW_CWD || path.resolve(__dirname, '.current')

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
      },
    },
  ],
}
