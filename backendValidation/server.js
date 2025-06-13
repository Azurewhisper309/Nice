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
  return done(null, profile);
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

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
