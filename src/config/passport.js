// src/config/passport.js

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback", // Must match the one in Google Console
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find if a user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // If user exists, return them
        return done(null, user);
      } else {
        // If not, check if they exist by email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If they exist by email, link their Google ID
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Otherwise, create a new user
        const newUser = await User.create({
          googleId: profile.id,
          fullname: profile.displayName,
          email: profile.emails[0].value,
          username: profile.emails[0].value.split('@')[0], // Create a username from email
          // Password is not needed for OAuth users
        });
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
  }
));

// These functions are used by express-session to store/retrieve user data from the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});