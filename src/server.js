require("dotenv").config();

const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const path = require("path");
const { pool, initDatabase } = require("./db/init");
const authRoutes = require("./routes/auth");
const { flashMessages } = require("./middleware/flash");

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "..", "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));

// Sessions backed by PostgreSQL
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "fallback-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Flash message middleware
app.use(flashMessages);

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use("/", authRoutes);

// Health check endpoint (used by FORGE for container health checks)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
  });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong."
        : err.message,
  });
});

// Start server after DB initialization
async function start() {
  try {
    await initDatabase();
    console.log("Database initialized successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Auth module running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
