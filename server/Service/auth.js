const jwt = require("jsonwebtoken");

function setUser(user) {
  return jwt.sign(
    {
      _id: user.id,
      email: user.email,
    },
    process.env.SECRET_KEY,
    { expiresIn: "7d" }
  );
}

function getUser(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

module.exports = { setUser, getUser };
