// src/routes/auth.routes.js

import { Router } from 'express';
import passport from 'passport';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessAndRefreshToken } from '../controllers/user.controllers.js'; // We need this function
import { verifyGoogleTokenAndLogin } from '../controllers/user.controllers.js';
const router = Router();

// Route to start the Google OAuth flow
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// The callback route that Google redirects to
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  async (req, res) => {
    // On successful authentication, req.user is available.
    // We now generate our own JWT for this user.
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(req.user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    };

    // Redirect to frontend with tokens (for web flow), or handle differently
    // For simplicity, we'll just send a success response. The mobile app will use a different flow.
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, { user: req.user, accessToken, refreshToken }, "User logged in successfully"));
  }
);
// MOBILE OAUTH ROUTE
router.post('/google/token', verifyGoogleTokenAndLogin);
export default router;