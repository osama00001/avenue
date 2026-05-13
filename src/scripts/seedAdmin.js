import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/onixdb";
// const MONGODB_URI = "mongodb+srv://support:C0EwVIYd9bA3wgvA@cluster0.9d5oou4.mongodb.net/avenue"

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    const adminData = {
      name: "Super Admin",
      username: "admin",
      email: "admin@gmail.com",
      password: "123456",
    };

    // Check duplicate by username OR email
    const existing = await Admin.findOne({
      $or: [{ username: adminData.username }, { email: adminData.email }],
    });

    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    await Admin.create({
      name: adminData.name,
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin seeded successfully!");
    console.log("Login credentials:");
    console.log("Username:", adminData.username);
    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
