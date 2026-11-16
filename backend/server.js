require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./db");

const propertiesRouter = require("./routes/properties");
const naturalSearchRouter = require("./routes/naturalSearch");

const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------
// Request logging middleware
// ---------------------------------------------

app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      `${timestamp} ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${duration}ms`
    );
  });

  next();
});

// ---------------------------------------------
// API routes
// ---------------------------------------------

app.use("/api/properties", propertiesRouter);
app.use("/api/search", naturalSearchRouter);

// ---------------------------------------------
// Database health check
// ---------------------------------------------

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );

    return res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

// ---------------------------------------------
// Start Express server
// ---------------------------------------------

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for Jest and Supertest.
module.exports = app;
