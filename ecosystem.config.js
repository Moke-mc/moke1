{
  "apps": [
    {
      "name": "edu-system-api",
      "script": "api/server.ts",
      "interpreter": "tsx",
      "watch": false,
      "instances": 1,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3001,
        "FRONTEND_URL": "https://your-frontend-domain.com"
      },
      "max_memory_restart": "500M",
      "error_file": "./logs/error.log",
      "out_file": "./logs/out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "merge_logs": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s"
    }
  ]
}
