const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1500 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new" }
  },
  { timestamps: true }
);

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const message = String(req.body.message || "").trim();
    const errors = [];

    if (name.length < 2 || name.length > 80) errors.push("Name must be 2 to 80 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please provide a valid email address.");
    if (!/^[0-9+()\-\s]{7,20}$/.test(phone)) errors.push("Please provide a valid phone number.");
    if (message.length < 10 || message.length > 1500) errors.push("Message must be 10 to 1500 characters.");

    if (errors.length) {
      return res.status(400).json({ message: "Please correct the contact form details.", errors });
    }

    await Contact.create({ name, email, phone, message });
    return res.status(201).json({ message: "Thank you. Your message has been sent to RK Dental Clinic." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
