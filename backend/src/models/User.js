import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    /** Full DSA pass (all tests): `dsa:<problemId>` — updated on successful submit only. */
    solvedProblemKeys: {
      type: [String],
      default: [],
    },
    /** Problem IDs where the user passed all public DSA tests (Run), for practice badges. */
    dsaPublicClearedIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
