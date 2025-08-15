const express = require("express");
const router = express.Router();

const getRoutes = require("./Get.routes");

router.use("/get", getRoutes);

module.exports = router;
