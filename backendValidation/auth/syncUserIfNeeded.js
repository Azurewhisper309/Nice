import UserModel from './UserModel.js'; // adjust path

export default async function syncUserIfNeeded(req, res, next) {
  try {
    await UserModel.insertIfMissing(req.user); // ✅ no raw SQL here
    next();
  } catch (err) {
    console.error('User sync failed:', err.message);
    res.status(500).json({ error: 'Failed to sync user' });
  }
}