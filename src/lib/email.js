import nodemailer from "nodemailer";
import Admin from "@/models/Admin";
import { baseTemplate } from "./email/baseTemplate";

// ======================================================
// TRANSPORT
// ======================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ======================================================
// VERIFY
// ======================================================
export const verifyMail = async () => {
  try {
    await transporter.verify();
    console.log("✅ Mail server ready");
  } catch (err) {
    console.error("❌ Mail server error:", err);
  }
};

// ======================================================
// ADMIN EMAIL FETCHER
// ======================================================
const getAdminEmails = async () => {
  const admins = await Admin.find({}).select("email -_id");
  return admins.map((a) => a.email).filter(Boolean);
};

// ======================================================
// BASE SENDERS
// ======================================================
const sendAdminMail = async ({ subject, html, text }) => {
  const to = await getAdminEmails();

  if (!to.length) throw new Error("No admin emails found");

  return transporter.sendMail({
    from: `"App Notification" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendUserMail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"Support" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

// ======================================================
// SIGNUP EMAILS
// ======================================================
export const signupMails = async ({ name, email }) => {
  // ---------------- ADMIN ----------------
  const adminHtml = baseTemplate({
    title: "New User Signup",
    content: `
      <p>A new user has registered:</p>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
    `,
    footer: "Avenue Admin Notification",
  });

  await sendAdminMail({
    subject: "🆕 New User Signup",
    text: `New signup: ${name} (${email})`,
    html: adminHtml,
  });

  // ---------------- USER ----------------
  const userHtml = baseTemplate({
    title: `Welcome to Avenue 📚`,
    content: `
      <p>Hi ${name},</p>

      <p>
        We're excited to have you join Avenue — your gateway to knowledge
        through carefully curated books.
      </p>

      <p>
        Start exploring today and discover something amazing to read.
      </p>

      <p><strong>Happy learning!</strong><br/>Team Avenue</p>
    `,
    footer: "© Avenue Books",
  });

  await sendUserMail({
    to: email,
    subject: "Welcome to Avenue 📚",
    text: `Welcome ${name}!`,
    html: userHtml,
  });
};

// ======================================================
// ORDER EMAILS
// ======================================================
export const orderMails = async (order) => {
  const itemsHtml = order.items
    .map((i) => `<li>${i.title} (x${i.qty})</li>`)
    .join("");

  const itemsText = order.items.map((i) => `${i.title} (x${i.qty})`).join("\n");

  // ---------------- ADMIN ----------------
  const adminHtml = baseTemplate({
    title: `New Order #${order.id}`,
    content: `
      <p><b>Customer:</b> ${order.userName}</p>
      <p><b>Email:</b> ${order.userEmail}</p>

      <p><b>Items:</b></p>
      <ul>${itemsHtml}</ul>

      <p><b>Total:</b> ₹${order.total}</p>
    `,
    footer: "Avenue Order System",
  });

  await sendAdminMail({
    subject: `📦 Order ${order.id}`,
    text: `Order ${order.id}\n${itemsText}`,
    html: adminHtml,
  });

  // ---------------- USER ----------------
  const userHtml = baseTemplate({
    title: "Order Confirmed ✅",
    content: `
      <p>Hi ${order.userName},</p>

      <p>Your order has been placed successfully.</p>

      <ul>${itemsHtml}</ul>

      <p><b>Total:</b> ₹${order.total}</p>

      <p>Thank you for shopping with Avenue!</p>
    `,
    footer: "© Avenue Books",
  });

  await sendUserMail({
    to: order.userEmail,
    subject: `Order Confirmed (#${order.id})`,
    text: `Order confirmed\n${itemsText}`,
    html: userHtml,
  });
};
