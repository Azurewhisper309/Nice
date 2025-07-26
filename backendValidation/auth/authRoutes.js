

router.get('/login', passport.authenticate('azuread-openidconnect'));
router.get('/redirect', passport.authenticate('azuread-openidconnect', {
  failureRedirect: '/'
}), syncUserIfNeeded, (req, res) => {
  res.redirect('http://localhost:5173');
});
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:5173`);
  });
});
router.get('/user', isAuthenticated, (req, res) => {
  const { oid, displayName, roles, principalName } = req.user;
  res.json({ oid, displayName, roles, principalName });
});
