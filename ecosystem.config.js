module.exports = {
  apps: [
    {
      name: "intrihub-web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-web-error.log",
      out_file: "./logs/pm2-web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "intrihub-socket",
      script: "./socket-server/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      error_file: "./logs/pm2-socket-error.log",
      out_file: "./logs/pm2-socket-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
