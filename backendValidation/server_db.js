import express from 'express';
import passport from 'passport';
import session from 'express-session';
import checkRole from './Middleware/checkRole.js';
import { azureStrategy } from './auth/passportStrategy.js';
import { sessionHandlers } from './auth/sessionHandlers.js';
import router_user from './Routes/User_path.js';
import router_admin from './Routes/Admin.js';
import UserModel from './auth/UserModel.js';
import cors from 'cors';
import csrf from 'csurf';
import router_auth from './auth/authRoutes.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';


dotenv.config(); // Load environment variables from .env file

const csrfProtection = csrf(); // cookie: false by default (uses session)
router_admin.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

router_user.get("/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//use cookie parser
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173', // or wherever your Vite frontend runs
  credentials: true,
})); 

passport.use(azureStrategy);
sessionHandlers(passport, UserModel); // your model logic

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,                // ✅ Don't resave session if not modified
  saveUninitialized: false      // ✅ Don't save empty session
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', router_auth);
app.use('/admin', checkRole('admin'), csrfProtection, router_admin);
app.use('/user',  checkRole('user'), csrfProtection, router_user);
//print the user roles

app.listen(3000, () => console.log('✅ Server running on port 3000'));
