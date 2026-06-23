const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, "Patient name is required."],
      trim: true,
      minlength: [2, "Patient name must be at least 2 characters."],
      maxlength: [80, "Patient name cannot exceed 80 characters."]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters."],
      match: [/^[0-9+()\-\s]{7,20}$/, "Please provide a valid phone number."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true,
      maxlength: [120, "Email cannot exceed 120 characters."],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."]
    },
    preferredDate: {
      type: Date,
      required: [true, "Preferred date is required."]
    },
    preferredTime: {
      type: String,
      required: [true, "Preferred time is required."],
      trim: true,
      maxlength: [20, "Preferred time cannot exceed 20 characters."]
    },
    dentalProblem: {
      type: String,
      required: [true, "Dental problem is required."],
      trim: true,
      maxlength: [120, "Dental problem cannot exceed 120 characters."]
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters."],
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ preferredDate: 1, status: 1 });
appointmentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
