const rolesOptions =['admin','user'];
export default function checkRole(role){
    const validRoles=rolesOptions[role];
    if(!validRoles) {
        throw new Error(`Invalid role: ${role}`);
    }
    return (req, res, next) => {
        if (!req.user || !req.user.roles || !req.user.roles.includes(validRoles)) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
        }
        next();
    };
}


//send user
// Middleware/injectUserRole.js
export function injectUserRole(req, res, next) {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ error: 'Missing user role in request' });
  }
  req.role = req.user.role; // role = 'user' or 'admin'
  next();
}
