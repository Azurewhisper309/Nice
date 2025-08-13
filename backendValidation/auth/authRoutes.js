import express from 'express';
import passport from 'passport';
import checkRole from '../Middleware/checkRole.js';
import syncUserIfNeeded from './syncUserIfNeeded.js';
import dotenv from 'dotenv';
import { limiter } from './sessionHandlers.js';

dotenv.config(); // Load environment variables from .env file
const router_auth = express.Router();
const appRoles = process.env.APP_ROLES ? process.env.APP_ROLES.split(',').map(role => role.trim().toLowerCase()):[];

router_auth.get('/login', passport.authenticate('azuread-openidconnect'),limiter);

router_auth.get('/redirect',
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/',
  }),
  syncUserIfNeeded,
  (req, res) => {
    res.redirect('http://localhost:5173');
  }
);

router_auth.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(
      'https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:5173'
    );
  });
});
//question
router_auth.get('/user', checkRole(appRoles), (req, res) => {
  const { id, name, roles, principalName } = req.user;
  res.json({ id, name, roles, principalName });
});



export default router_auth;
