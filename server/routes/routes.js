const express = require("express");
const router = express.Router();
require('./submissions')(router); // can potentially do this with other collections' routes if we have other collections

module.exports = router;
