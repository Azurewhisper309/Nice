
export function setupSession(passport, UserModel) {
  passport.serializeUser((user, done) => done(null, user.oid));

  passport.deserializeUser(async (oid, done) => {
    try {
      const user = await UserModel.findByOid(oid); // replace with your query
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}
