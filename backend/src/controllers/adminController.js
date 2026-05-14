import User from "../models/User.js";
import Session from "../models/Session.js";
import Submission from "../models/Submission.js";

export async function getAdminStats(req, res) {
  try {
    const [totalUsers, totalSessions, activeSessions, totalSubmissions, recentSubmissions] =
      await Promise.all([
        User.countDocuments(),
        Session.countDocuments(),
        Session.countDocuments({ status: "active" }),
        Submission.countDocuments(),
        Submission.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      ]);

    const passRate = await Submission.aggregate([
      { $match: { status: { $in: ["passed", "failed"] } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ["$status", "passed"] }, 1, 0] } },
        },
      },
    ]);

    const rate = passRate[0]
      ? Math.round((passRate[0].passed / passRate[0].total) * 100)
      : 0;

    return res.status(200).json({
      totalUsers,
      totalSessions,
      activeSessions,
      totalSubmissions,
      recentSubmissions24h: recentSubmissions,
      overallPassRate: rate,
    });
  } catch (error) {
    console.error("getAdminStats error:", error.message);
    return res.status(500).json({ error: "Failed to load admin stats" });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search || "").trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name email profileImage role clerkId solvedProblemKeys dsaPublicClearedIds createdAt"),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getAdminUsers error:", error.message);
    return res.status(500).json({ error: "Failed to load users" });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select(
      "name email role clerkId"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("updateUserRole error:", error.message);
    return res.status(500).json({ error: "Failed to update user role" });
  }
}

export async function getAdminSubmissions(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const track = req.query.track || "";
    const status = req.query.status || "";

    const filter = {};
    if (track) filter.track = track;
    if (status) filter.status = status;

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email profileImage")
        .select("user problemId track language status score runtimeMs summary createdAt"),
      Submission.countDocuments(filter),
    ]);

    return res.status(200).json({
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getAdminSubmissions error:", error.message);
    return res.status(500).json({ error: "Failed to load submissions" });
  }
}

export async function checkAdminRole(req, res) {
  return res.status(200).json({ isAdmin: req.user?.role === "admin" });
}
