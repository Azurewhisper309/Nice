export default function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.roles?.[0]?.toLowerCase();
    if (!allowedRoles.includes(userRole) || !userRole) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions. or user role is missing' });
    }
    next();
  };
}
