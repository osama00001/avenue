import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import Admin from "@/models/Admin";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "credentials",

      // ✅ REQUIRED — DO NOT LEAVE EMPTY
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        admin: { label: "Admin", type: "text" },
      },

      async authorize(credentials) {
        await connectDB();

        const { email, password, admin } = credentials;

        if (!email || !password) {
          return null;
        }

        /* ---------- ADMIN LOGIN ---------- */
        if (admin === "true") {
          const identifier = email.toLowerCase().trim();

          const adminUser = await Admin.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          });

          if (!adminUser) return null;

          const passMatch = await bcrypt.compare(password, adminUser.password);

          if (!passMatch) return null;

          return {
            id: adminUser._id.toString(),
            email: adminUser.email,
            username: adminUser.username,
            name: adminUser.name,
            role: "admin",
          };
        }

        /* ---------- USER LOGIN ---------- */
        const user = await User.findOne({ email });
        if (!user) return null;

        const passMatch = await bcrypt.compare(password, user.password);
        if (!passMatch) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          role: "user",
          name: user.name || `${user.firstName} ${user.lastName}`,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.email = token.email;
      }
      return session;
    },
  },
};
