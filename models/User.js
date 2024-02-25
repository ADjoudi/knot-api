const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  display_name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invite" }],
});

module.exports = mongoose.model("User", UserSchema);
