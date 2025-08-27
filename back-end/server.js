const express = require("express");
const { connect } = require("mongoose");
const router = require("./src/routers/index.js");
const dotenv = require("dotenv");
const cors = require("cors");
const { initScheduler } = require("./src/config/scheduler");
const http = require("http");
const { initSocketServer } = require("./src/services/socketService");
const { initRedis } = require("./src/config/redis");

const complaintRoutes = require("./src/routers/complaintRoutes.js");

const app = express();
dotenv.config(); // Move dotenv.config() before using process.env
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Log request body for POST/PUT requests
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request body:", JSON.stringify(req.body));
  }

  // Capture the original send
  const originalSend = res.send;

  // Override send to log response
  res.send = function (body) {
    console.log(
      `[${new Date().toISOString()}] Response ${res.statusCode} for ${req.url}`
    );

    // Restore original send and call it
    res.send = originalSend;
    return res.send(body);
  };

  next();
});

app.use("/api/complaints", complaintRoutes);

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

// Initialize Redis (optional - app will work without it)
initRedis()
  .then(() => console.log("Redis initialized successfully"))
  .catch((err) => {
    console.warn("Redis initialization failed (app will continue without Redis):", err.message);
  });

// Improve MongoDB connection with error handling
console.log("Connecting to MongoDB...");
connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api", router);

// Health check endpoint for load balancer
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
    memory: process.memoryUsage()
  });
});

// Fallback route for handling payment redirects
app.get("/", (req, res) => {
  const { paymentStatus } = req.query;
  const frontendUrl = process.env.CLIENT_URL || "http://localhost:3000";

  if (paymentStatus) {
    // Redirect to frontend with payment status
    return res.redirect(`${frontendUrl}?paymentStatus=${paymentStatus}`);
  }

  // Default redirect to frontend
  res.redirect(frontendUrl);
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);

// Store io instance on app for potential use in request handlers
app.set("io", io);

// Listen on server (not app)
server.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
  console.log(`WebSocket server is running`);
  console.log(`Worker PID: ${process.pid}`);

  // Initialize schedulers after server starts
  initScheduler();
});

// Store server instance globally for graceful shutdown
global.server = server;
