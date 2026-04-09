module.exports = {
  apps: [
    {
      name: 'araucaria-api',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Restart on failure
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      // Logs
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Watch (disabled in prod)
      watch: false,
    },
  ],
};
