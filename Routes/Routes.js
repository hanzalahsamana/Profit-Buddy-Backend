const express = require("express");
const router = express.Router();

const postRoutes = require("./Post.routes");
const getRoutes = require("./Get.routes");

router.use("/post", postRoutes);
router.use("/get", getRoutes);

module.exports = router;
