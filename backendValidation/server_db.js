import express from 'express';
import passport from 'passport';
import session from 'express-session';
import checkRole from './Middleware/checkRole.js';
import { azureStrategy } from './auth/passportStrategy.js';
import { setupSession } from './auth/sessionHandlers.js';
import authRoutes from './auth/authRoutes.js';
import router_user from './Routes/User.js';
import router_admin from './Routes/Admin.js';

passport.use(azureStrategy);
setupSession(passport, myUserModel); // your model logic

const app = express();
app.use(session({
secret: process.env.SESSION_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/admin', isAuthenticated, checkRole('admin'), router_admin);
app.use('/user', isAuthenticated, checkRole('user'), router_user);
 