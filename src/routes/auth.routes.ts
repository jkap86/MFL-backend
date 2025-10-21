import { Router } from "express";
import { body } from "express-validator";
import { authController } from "../controllers/auth.controller";

const router = Router();

// Login validation
const loginValidation = [
  body("username").trim().notEmpty().withMessage("MFL username is required"),
  body("password").notEmpty().withMessage("MFL password is required"),
];

/**
 * Authentication Routes
 */

// POST /api/auth/login - Login with MFL credentials
router.post("/login", loginValidation, authController.login);

// GET /api/auth/session - Get current session info
router.get("/session", authController.getSession);

// GET /api/auth/refresh-leagues - Refresh user's leagues
router.get("/refresh-leagues", authController.refreshLeagues);

// POST /api/auth/logout - Logout
router.post("/logout", authController.logout);

/**
 * League Management Routes
 */

// POST /api/auth/:leagueId/lineup - Set lineup
router.post("/:leagueId/lineup", authController.setLineup);

// POST /api/auth/:leagueId/waiver - Submit waiver claim
router.post("/:leagueId/waiver", authController.submitWaiver);

// POST /api/auth/:leagueId/trade - Propose trade
router.post("/:leagueId/trade", authController.proposeTrade);

export default router;
