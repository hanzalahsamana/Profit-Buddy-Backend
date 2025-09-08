const { verifyJwt } = require("../Utils/Jwt");

const tokenChecker = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token format." });
  }

  try {
    const decoded = await verifyJwt(token);
    if (!decoded) {
      return res.status(401).json({ message: "Token is invalid." });
    }

    req.query.userId = decoded._id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please login again." });
    }
    return res.status(403).json({ message: "Invalid token." });
  }
};

module.exports = tokenChecker;
