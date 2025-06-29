import express from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import cors from 'cors';
import  Strategy  from 'passport-azure-ad';
const {OIDCStrategy} = Strategy;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false
}));

// CORS middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Azure AD OIDC Strategy
passport.use(new OIDCStrategy({
  identityMetadata: `${process.env.AZURE_AUTHORITY}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: process.env.AZURE_REDIRECT_URI,
  allowHttpForRedirectUrl: true,
  scope: ['openid', 'profile', 'email']
}, (iss, sub, profile, accessToken, refreshToken, done) => {
  // Map Azure AD fields to your user object
  const user = {
    principalName: profile._json.preferred_username || profile._json.email || profile.email,
    displayName: profile.displayName || profile._json.name,
    jobTitle: profile._json.jobTitle,
    roles: profile._json.roles || ['user'], // fallback to 'user' if roles not present?
    email: profile._json.email || profile.email
  };
  console.log("Azure AD user mapped:", user);
  return done(null, user);
}));

// Routes
app.get('/auth/login', passport.authenticate('azuread-openidconnect'));

app.get('/auth/redirect',
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/',
  }),
  (req, res) => {
    res.redirect('http://localhost:5173');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:5173');
  });
});

app.get('/auth/user/:use', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      roles: req.user.roles,
      principalName: req.user.principalName,
      displayName: req.user.displayName,
      jobTitle: req.user.jobTitle,
      email: req.user.email
    });

  } else {
    res.status(401).json({
      isAuthenticated: false,
      roles: [],
      principalName: "",
      displayName: "",
      jobTitle: "",
      email: ""
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});