const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  date: { type: mongoose.Schema.Types.Date },
});

module.exports = mongoose.model("Message", MessageSchema);
