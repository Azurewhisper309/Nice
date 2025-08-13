
import UserModel from './UserModel.js';
import rateLimit from 'express-rate-limit';
import { sanitizeUser } from '../Middleware/sanitized.js';

export function sessionHandlers(passport) {
  passport.serializeUser((user, done) => {
    if (!user.oid) {
      done(new Error('Missing oid'), null)
    }
    //check if oid is valid
    done(null, user.oid);
  });

  passport.deserializeUser(async (oid, done) => {
  try {
    // ✅ Validate oid
    if (!oid || typeof oid !== 'string') {
      return done(null, false);
    }

    // ✅ Find user in DB
    let user = await UserModel.findByOid(oid);
    if (!user) {
      return done(null, false);
    }

    // ✅ If user not in DB, insert minimal record
    user = await UserModel.insertIfMissing(user);

    // ❌ Block if admin is kicked
    if (user.is_kicked === true) {
      return done(null, false);
    }

    // ✅ Sanitize user object
    const safeUser = sanitizeUser(user);

    // ✅ Shape session DTO (only needed fields)
    const sessionUser = {
      id: safeUser.id,                // same as oid
      name: safeUser.name,
      principalName: safeUser.principalName,
      roles: safeUser.roles || []
    };

    return done(null, sessionUser);

  } catch (err) {
    console.error('❌ deserializeUser failed:', err);
    return done(err, null);
  }
});
}

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'to much requests!' // limit each IP to 20 requests/min
});