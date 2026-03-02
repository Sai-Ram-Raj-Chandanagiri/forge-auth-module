const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/init");
const { requireGuest, requireAuth } = require("../middleware/auth");

const router = express.Router();

// ───────────── HOME ─────────────

router.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

// ───────────── LOGIN ─────────────

router.get("/login", requireGuest, (req, res) => {
  res.render("login", { title: "Sign In", errors: [] });
});

router.post(
  "/login",
  requireGuest,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("login", {
        title: "Sign In",
        errors: errors.array(),
        email: req.body.email,
      });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.render("login", {
          title: "Sign In",
          errors: [{ msg: "Invalid email or password" }],
          email,
        });
      }

      // Update last login
      await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [user.id]);

      // Set session
      req.session.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      };

      req.session.flash = { type: "success", message: `Welcome back, ${user.full_name}!` };
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      res.render("login", {
        title: "Sign In",
        errors: [{ msg: "An error occurred. Please try again." }],
        email,
      });
    }
  }
);

// ───────────── REGISTER ─────────────

router.get("/register", requireGuest, (req, res) => {
  res.render("register", { title: "Create Account", errors: [] });
});

router.post(
  "/register",
  requireGuest,
  [
    body("fullName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be 2-100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("register", {
        title: "Create Account",
        errors: errors.array(),
        fullName: req.body.fullName,
        email: req.body.email,
      });
    }

    const { fullName, email, password } = req.body;

    try {
      // Check if email already exists
      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        return res.render("register", {
          title: "Create Account",
          errors: [{ msg: "An account with this email already exists" }],
          fullName,
          email,
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Insert user
      const result = await pool.query(
        "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name",
        [email, passwordHash, fullName]
      );

      const user = result.rows[0];

      // Auto-login after registration
      req.session.user = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      };

      req.session.flash = { type: "success", message: "Account created successfully!" };
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      res.render("register", {
        title: "Create Account",
        errors: [{ msg: "An error occurred. Please try again." }],
        fullName,
        email,
      });
    }
  }
);

// ───────────── DASHBOARD (protected) ─────────────

router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, created_at, last_login_at FROM users WHERE id = $1",
      [req.session.user.id]
    );
    const user = result.rows[0];

    // Get total user count for demo display
    const countResult = await pool.query("SELECT COUNT(*) as total FROM users");
    const totalUsers = parseInt(countResult.rows[0].total, 10);

    res.render("dashboard", {
      title: "Dashboard",
      profile: user,
      totalUsers,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).render("error", {
      title: "Error",
      message: "Failed to load dashboard",
    });
  }
});

// ───────────── LOGOUT ─────────────

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.redirect("/login");
  });
});

module.exports = router;
