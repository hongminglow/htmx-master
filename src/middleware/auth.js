function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    next();
    return;
  }

  if (req.get("HX-Request")) {
    res.set("HX-Redirect", "/login").status(401).send("");
    return;
  }

  res.redirect("/login");
}

module.exports = { requireAuth };
