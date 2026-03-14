import express from "express";
import convex from "../services/convexClient.js";
import { api } from "../../convex/_generated/api.js";

const router = express.Router();

// Mock OTP storage (in production, use Redis or a database)
const otps = new Map();

router.post("/send-otp", async (req, res) => {
    let { mobileNumber } = req.body;
    if (!mobileNumber) {
        return res.status(400).json({ error: "Mobile number is required" });
    }

    // Normalize number
    const normalizedNumber = mobileNumber.replace(/\D/g, "");

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP for 5 minutes
    otps.set(normalizedNumber, {
        otp,
        expiry: Date.now() + 5 * 60 * 1000
    });

    console.log(`[AUTH] OTP for ${normalizedNumber}: ${otp}`);

    // In a real app, send OTP via SMS service here
    res.json({ success: true, otp, message: "OTP sent (check server console in real flow)" });
});

router.post("/verify-otp", async (req, res) => {
    let { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
        return res.status(400).json({ error: "Mobile number and OTP are required" });
    }

    const normalizedNumber = mobileNumber.replace(/\D/g, "");
    const storedData = otps.get(normalizedNumber);

    if (!storedData) {
        return res.status(400).json({ error: "No OTP found for this number" });
    }

    if (Date.now() > storedData.expiry) {
        otps.delete(mobileNumber);
        return res.status(400).json({ error: "OTP has expired" });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    // OTP verified, clear it
    otps.delete(mobileNumber);

    try {
        const searchNumber = mobileNumber.replace(/\D/g, "");
        console.log(`[AUTH] Verifying for searchNumber: ${searchNumber}`);

        // Use the new dedicated query for faster lookup
        const user = await convex.query(api.users.getByMobileNumber, { mobileNumber: searchNumber });

        if (!user) {
            console.log(`[AUTH] LOGIN FAILED for ${searchNumber} - User not found in DB`);
            return res.status(404).json({ error: "User not found. Please contact administration." });
        }

        console.log(`[AUTH] LOGIN SUCCESS for ${user.name}`);

        // Log the login in Convex
        await convex.mutation(api.loginLogs.logLogin, {
            userId: user._id,
            email: user.email || `${searchNumber}@mobile.user`,
            organizationId: user.organizationId,
            ipAddress: req.ip,
            loginStatus: "success"
        });

        res.json({
            success: true,
            user,
            token: "mock-jwt-token"
        });
    } catch (error) {
        console.error("[AUTH] verify-otp error DETAILS:", {
            message: error.message,
            stack: error.stack,
            error
        });
        res.status(500).json({ 
            error: "Internal server error", 
            details: error.message 
        });
    }
});

export default router;
