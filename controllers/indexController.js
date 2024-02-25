const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const Message = require("../models/Message");
const Invite = require("../models/Invite");

exports.user_info_get = asyncHandler(async function (req, res, next) {
  if (!req.user) {
    res.json({ error: "user not found" });
    return;
  }
  res.json({
    _id: req.user._id,
    display_name: req.user.display_name,
    contacts: req.user.contacts,
    invites: req.user.invites,
  });
});

exports.chat_log_get = asyncHandler(async function (req, res, next) {
  if (!req.user) {
    res.json({ error: "user not found" });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.contactID)) {
    res.json({ error: "Not a valid contact" });
    return;
  }
  const messages = await Message.find({
    from: req.user._id,
    to: req.params.contactID,
  })
    .sort({ date: -1 })
    .exec();
  res.json(messages);
});

exports.chat_message_post = [
  body("message").trim().escape(),
  asyncHandler(async function (req, res, next) {
    const errors = validationResult(req);
    if (
      !errors.isEmpty() ||
      !req.user ||
      !mongoose.isValidObjectId(req.params.contactID)
    ) {
      res.json({ error: "invalid inputs" });
      return;
    }
    const message = new Message({
      from: req.user._id,
      to: req.params.contactID,
      message: req.body.message,
      date: new Date(),
    });
    await message.save();
    res.json({ success: true });
  }),
];

exports.invites_get = asyncHandler(async function (req, res, next) {
  if (!req.user) {
    res.json({ error: "invalid inputs" });
    return;
  }
  const user = await User.findById(req.user._id).populate("invites").exec();
  res.json({ invites: user.invites });
});

exports.invite_send = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.contactID)) {
    res.json({ error: "invalid inputs" });
    return;
  }
  const contact = await User.findById(req.params.contactID);
  const InviteModel = new Invite({
    from: req.user.id,
    to: req.params.contactID,
  });
  const invite = await InviteModel.save();
  contact.invites.push(invite._id);
  await contact.save();
  res.json({ success: true });
});

exports.invite_accept = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.inviteID)) {
    res.json({ error: "invalid inputs" });
    return;
  }
  const invite = await Invite.findById(req.params.inviteID);
  const user = await User.findById(req.user.id);
  const contact = await User.findById(invite.from);
  if (user._id.toString() !== invite.to.toString()) {
    res.json({ error: "server error" });
    return;
  }
  user.contacts.push(invite.from);
  contact.contacts.push(invite.to);
  user.invites = user.invites.filter(
    (userInvite) => userInvite.toString() !== invite._id.toString()
  );
  await Invite.deleteOne(invite);
  await user.save();
  await contact.save();
  res.json({ success: true });
});

exports.invite_reject = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.inviteID)) {
    res.json({ error: "invalid inputs" });
    return;
  }
  const invite = await Invite.findById(req.params.inviteID);
  const user = await User.findById(req.user._id);
  if (user._id.toString() !== invite.to.toString()) {
    res.json({ error: "server error" });
    return;
  }
  user.invites = user.invites.filter(
    (userInvite) => userInvite.toString() !== invite._id.toString()
  );
  await Invite.deleteOne(invite);
  await user.save();
  res.json({ success: true });
});
