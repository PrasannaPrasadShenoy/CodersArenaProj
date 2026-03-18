import { requireAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });

      // Lazy sync: if user not in DB (e.g. Inngest webhook missed or not set up), create from Clerk
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const primaryEmail = clerkUser.primaryEmailAddress ?? clerkUser.emailAddresses?.[0];
        const emailStr =
          primaryEmail?.emailAddress ?? primaryEmail?.email_address ?? `${clerkId}@clerk.user`;
        const firstName = clerkUser.firstName ?? "";
        const lastName = clerkUser.lastName ?? "";
        const name = [firstName, lastName].filter(Boolean).join(" ") || "User";
        const profileImage = clerkUser.imageUrl ?? "";

        user = await User.create({
          clerkId,
          email: String(emailStr).trim() || `${clerkId}@clerk.user`,
          name,
          profileImage,
        });

        await upsertStreamUser({
          id: clerkId,
          name,
          image: profileImage,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      const message =
        process.env.NODE_ENV === "development"
          ? (error.message || "Internal Server Error")
          : "Internal Server Error";
      res.status(500).json({ message });
    }
  },
];
