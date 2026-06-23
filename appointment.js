const express = require("express");
const jwt = require("jsonwebtoken");
const Appointment = require("../models/Appointment");

const router = express.Router();

function getJwtSecret() {
  return process.env.JWT_SECRET || "development-only-change-this-secret";
}

function readAuth(required = false) {
  return (req, res, next) => {
    const authorization = req.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      if (required) return res.status(401).json({ message: "Authentication is required." });
      return next();
    }

    try {
      req.auth = jwt.verify(authorization.slice(7), getJwtSecret());
      return next();
    } catch {
      return res.status(401).json({ message: "Your session is invalid or has expired." });
    }
  };
}

function validateAppointment(body) {
  const errors = [];
  const patientName = String(body.patientName || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const preferredDate = String(body.preferredDate || "").trim();
  const preferredTime = String(body.preferredTime || "").trim();
  const dentalProblem = String(body.dentalProblem || "").trim();
  const message = String(body.message || "").trim();

  if (patientName.length < 2 || patientName.length > 80) errors.push("Patient name must be 2 to 80 characters.");
  if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) errors.push("Please provide a valid phone number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please provide a valid email address.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.push("Please provide a valid preferred date.");
  if (!preferredTime || preferredTime.length > 20) errors.push("Please provide a valid preferred time.");
  if (!dentalProblem || dentalProblem.length > 120) errors.push("Please select or describe the dental problem.");
  if (message.length > 1000) errors.push("Message cannot exceed 1000 characters.");

  const requestedDate = new Date(`${preferredDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!Number.isNaN(requestedDate.getTime()) && requestedDate < today) {
    errors.push("Preferred date cannot be in the past.");
  }

  return {
    errors,
    data: {
      patientName,
      phone,
      email: email.toLowerCase(),
      preferredDate: requestedDate,
      preferredTime,
      dentalProblem,
      message
    }
  };
}

router.post("/", readAuth(false), async (req, res, next) => {
  try {
    const { errors, data } = validateAppointment(req.body);
    if (errors.length) {
      return res.status(400).json({ message: "Please correct the appointment details.", errors });
    }

    const appointment = await Appointment.create({
      ...data,
      user: req.auth?.userId || null
    });

    return res.status(201).json({
      message: "Appointment request received. RK Dental Clinic will contact you to confirm.",
      appointment: {
        id: appointment._id.toString(),
        patientName: appointment.patientName,
        preferredDate: appointment.preferredDate,
        preferredTime: appointment.preferredTime,
        dentalProblem: appointment.dentalProblem,
        status: appointment.status
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", readAuth(true), async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.auth.userId })
      .sort({ createdAt: -1 })
      .select("patientName preferredDate preferredTime dentalProblem message status createdAt")
      .lean();
    return res.json({ appointments });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
