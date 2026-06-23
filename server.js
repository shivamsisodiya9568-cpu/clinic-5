require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointment");
const contactRoutes = require("./routes/contact");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rk_dental_clinic";

const configuredOrigins = String(process.env.CLIENT_ORIGIN || "http://localhost:5000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === "null" || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("This origin is not allowed by the server CORS policy."));
    }
  })
);
app.use(express.json({ limit: "25kb" }));
app.use(express.urlencoded({ extended: false, limit: "25kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RK Dental Clinic API",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/contact", contactRoutes);

app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    fallthrough: false
  })
);

const frontendFiles = ["index.html", "login.html", "appointment.html", "style.css", "script.js"];
frontendFiles.forEach((file) => {
  app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
});
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "index.html"));
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with that information already exists." });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Please correct the submitted information.",
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "The supplied identifier is not valid." });
  }

  if (error.message?.includes("CORS")) {
    return res.status(403).json({ message: error.message });
  }

  return res.status(error.status || 500).json({
    message: process.env.NODE_ENV === "production" ? "An unexpected server error occurred." : error.message || "Server error."
  });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      console.warn("Warning: JWT_SECRET is not set. The development fallback must not be used in production.");
    }

    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`RK Dental Clinic is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});
