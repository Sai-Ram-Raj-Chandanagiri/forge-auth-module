/**
 * Flash message middleware.
 * Reads flash messages from session and makes them available in views.
 */
function flashMessages(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

module.exports = { flashMessages };
