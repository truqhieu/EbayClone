module.exports = {
  apps: [
    {
      name: 'app-instance-1',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WORKER_ID: 1
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        WORKER_ID: 1
      },
      // Monitoring and logging
      log_file: './logs/app-1.log',
      out_file: './logs/app-1-out.log',
      error_file: './logs/app-1-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced PM2 features
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs', '*.log'],
      watch_options: {
        followSymlinks: false
      }
    },
    {
      name: 'app-instance-2',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        WORKER_ID: 2
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002,
        WORKER_ID: 2
      },
      log_file: './logs/app-2.log',
      out_file: './logs/app-2-out.log',
      error_file: './logs/app-2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      watch_options: {
        followSymlinks: false
      }
    },
    {
      name: 'app-instance-3',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        WORKER_ID: 3
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3003,
        WORKER_ID: 3
      },
      log_file: './logs/app-3.log',
      out_file: './logs/app-3-out.log',
      error_file: './logs/app-3-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      watch_options: {
        followSymlinks: false
      }
    },
    {
      name: 'app-instance-4',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        WORKER_ID: 4
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3004,
        WORKER_ID: 4
      },
      log_file: './logs/app-4.log',
      out_file: './logs/app-4-out.log',
      error_file: './logs/app-4-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      watch_options: {
        followSymlinks: false
      }
    }
  ],

  // Cluster mode alternative (uncomment to use cluster mode instead)
  /*
  apps: [
    {
      name: 'app-cluster',
      script: './server.js',
      instances: 'max', // Or specify number like 4
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      log_file: './logs/app-cluster.log',
      out_file: './logs/app-cluster-out.log',
      error_file: './logs/app-cluster-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log']
    }
  ]
  */

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['server1.example.com', 'server2.example.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/your-app',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    staging: {
      user: 'deploy',
      host: 'staging.example.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/your-repo.git',
      path: '/var/www/staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};