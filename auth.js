const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function getJwtSecret() {
  return process.env.JWT_SECRET || "development-only-change-this-secret";
}

function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function validateSignup({ name, email, phone, password }) {
  const errors = [];
  if (!name || String(name).trim().length < 2) errors.push("Name must be at least 2 characters.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) errors.push("A valid email is required.");
  if (!phone || !/^[0-9+()\-\s]{7,20}$/.test(String(phone))) errors.push("A valid phone number is required.");
  if (!password || !/(?=.*[A-Za-z])(?=.*\d).{8,72}/.test(String(password))) {
    errors.push("Password must be 8 to 72 characters and contain at least one letter and one number.");
  }
  return errors;
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication is required." });
  }

  try {
    req.auth = jwt.verify(authorization.slice(7), getJwtSecret());
    return next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or has expired." });
  }
}

router.post("/signup", async (req, res, next) => {
  try {
    const payload = {
      name: String(req.body.name || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
      phone: String(req.body.phone || "").trim(),
      password: String(req.body.password || "")
    };
    const errors = validateSignup(payload);

    if (errors.length) {
      return res.status(400).json({ message: "Please correct the highlighted information.", errors });
    }

    const existingUser = await User.findOne({ email: payload.email }).lean();
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create(payload);
    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user),
      user: user.toSafeObject()
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: "User account was not found." });
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
