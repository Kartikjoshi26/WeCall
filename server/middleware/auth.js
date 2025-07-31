const { getUser } = require("../Service/auth");

async function restrictToLoginUser(req, res, next) {
  const userUid = req.cookies?.uid;

  if (!userUid) {
    return res.status(401).json({
      success: false,
      user: null,
      message: "not logged in",
    });
  }

  try {
    const user = getUser(userUid);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal error verifying token",
    });
  }
}

module.exports = { restrictToLoginUser };
