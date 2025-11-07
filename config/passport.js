const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth v2 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ 
        oauthProvider: 'google', 
        oauthId: profile.id 
      });

      if (user) {
        // Update tokens if user exists
        user.oauthAccessToken = accessToken;
        if (refreshToken) user.oauthRefreshToken = refreshToken;
        await user.save();
        return done(null, user);
      }

      // Check if email already exists (link accounts)
      const emailExists = await User.findOne({ 
        email: profile.emails[0].value 
      });

      if (emailExists) {
        // Link OAuth to existing account
        emailExists.oauthProvider = 'google';
        emailExists.oauthId = profile.id;
        emailExists.oauthAccessToken = accessToken;
        if (refreshToken) emailExists.oauthRefreshToken = refreshToken;
        emailExists.profilePicture = profile.photos[0]?.value;
        emailExists.isEmailVerified = true;
        await emailExists.save();
        return done(null, emailExists);
      }

      // Create new user from Google profile
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        oauthProvider: 'google',
        oauthId: profile.id,
        oauthAccessToken: accessToken,
        oauthRefreshToken: refreshToken,
        profilePicture: profile.photos[0]?.value,
        isEmailVerified: true
      });

      await user.save();
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -oauthAccessToken -oauthRefreshToken');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;