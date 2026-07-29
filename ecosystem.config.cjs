module.exports = {
  apps: [
    {
      name: "lumen",
      script: "node_modules/.bin/next",
      args: "start --port 3006",
      cwd: "/var/www/lumen",
      env: {
        NODE_ENV: "production",
        PORT: "3006",
      },
      max_memory_restart: "300M",
    },
  ],
};
