import { body, ValidationChain } from "express-validator";

/**
 * Validation rules for user registration
 */
export const registerValidation: ValidationChain[] = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

/**
 * Validation rules for user login
 */
export const loginValidation: ValidationChain[] = [
  body("username").trim().notEmpty().withMessage("Username is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for adding a league
 */
export const addLeagueValidation: ValidationChain[] = [
  body("leagueId")
    .trim()
    .notEmpty()
    .withMessage("League ID is required")
    .matches(/^[0-9]+$/)
    .withMessage("League ID must be numeric"),

  body("password").optional().trim(),
];

/**
 * Validation rules for updating user
 */
export const updateUserValidation: ValidationChain[] = [
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];
