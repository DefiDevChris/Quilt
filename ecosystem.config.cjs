module.exports = {
  apps: [
    {
      name: 'quilt-3000',
      cwd: '/home/chrishoran/Desktop/Quilt',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev --turbopack -p 3000',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
