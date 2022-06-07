const mongoose = require("mongoose");

const schema = mongoose.Schema({
    email: { type : String , unique : true, required : true}, // only accept unique emails
    collected: Boolean // whether it was sent to the BWWC already
});

module.exports = mongoose.model("Submission", schema);
