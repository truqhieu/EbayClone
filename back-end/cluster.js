const cluster = require('cluster');
const os = require('os');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const numCPUs = os.cpus().length;
const PORT_START = parseInt(process.env.PORT) || 3000;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  console.log(`Starting ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork({
      PORT: PORT_START + i,
      WORKER_ID: i
    });
    
    console.log(`Worker ${worker.process.pid} started on port ${PORT_START + i}`);
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Starting a new worker...');
    
    // Restart the worker with the same port
    const newWorker = cluster.fork({
      PORT: worker.env.PORT,
      WORKER_ID: worker.env.WORKER_ID
    });
    
    console.log(`New worker ${newWorker.process.pid} started on port ${worker.env.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('Forcing shutdown...');
      process.exit(0);
    }, 10000);
  });

  process.on('SIGINT', () => {
    console.log('Master received SIGINT, shutting down gracefully...');
    
    for (const id in cluster.workers) {
      cluster.workers[id].kill('SIGINT');
    }
    
    setTimeout(() => {
      console.log('Forcing shutdown...');
      process.exit(0);
    }, 10000);
  });

} else {
  // Worker process
  console.log(`Worker ${process.pid} started on port ${process.env.PORT}`);
  
  // Set the PORT environment variable for the worker
  process.env.PORT = process.env.PORT || PORT_START;
  
  // Start the Express server
  require('./server.js');
  
  // Graceful shutdown for workers
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} received SIGTERM, shutting down gracefully...`);
    
    // Close server gracefully
    if (global.server) {
      global.server.close(() => {
        console.log(`Worker ${process.pid} shut down gracefully`);
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  process.on('SIGINT', () => {
    console.log(`Worker ${process.pid} received SIGINT, shutting down gracefully...`);
    
    if (global.server) {
      global.server.close(() => {
        console.log(`Worker ${process.pid} shut down gracefully`);
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}