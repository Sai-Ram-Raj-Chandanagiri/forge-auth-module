/**
 * Require the user to be authenticated.
 * Redirects to /login if not logged in.
 */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: "error", message: "Please sign in to continue." };
    return res.redirect("/login");
  }
  next();
}

/**
 * Require the user to NOT be authenticated (for login/register pages).
 * Redirects to /dashboard if already logged in.
 */
function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = { requireAuth, requireGuest };
