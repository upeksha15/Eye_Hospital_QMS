import { body } from 'express-validator';

export const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('nicNumber')
    .trim()
    .notEmpty()
    .withMessage('NIC number is required'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Please enter a valid date'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const updateValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('address')
    .optional()
    .trim(),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
];