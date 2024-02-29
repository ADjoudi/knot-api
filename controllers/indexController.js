const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const Message = require("../models/Message");
const Invite = require("../models/Invite");
const { options } = require("../routes");

exports.user_info_get = asyncHandler(async function (req, res, next) {
  if (!req.user) {
    res.status(500).json({ error: "user not found" });
    return;
  }

  const user = await User.findById(req.user._id)
    .populate({
      path: "contacts",
      select: "_id display_name",
    })
    .select("_id display_name contacts invites")
    .lean(true)
    .exec();
  res.json(user);
});

exports.chat_log_get = asyncHandler(async function (req, res, next) {
  if (!req.user) {
    res.status(500).json({ error: "user not found" });
    return;
  }
  if (!mongoose.isValidObjectId(req.params.contactID)) {
    res.status(500).json({ error: "Not a valid contact" });
    return;
  }

  const messages = await Message.find({
    $or: [
      { from: req.user._id, to: req.params.contactID },
      { from: req.params.contactID, to: req.user._id },
    ],
  })
    .populate({ path: "from to", select: "_id display_name" })
    .sort({ date: 1 })
    .lean(true)
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
      res.status(500).json({ error: "invalid inputs" });
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
    res.status(500).json({ error: "invalid inputs" });
    return;
  }

  const invites = await User.findById(req.user._id)
    .select("invites")
    .populate("invites")
    .lean(true)
    .exec();

  res.json(invites);
});

exports.invite_send = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.contactID)) {
    res.status(500).json({ error: "invalid inputs" });
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
    res.status(500).json({ error: "invalid inputs" });
    return;
  }

  const invite = await Invite.findById(req.params.inviteID);
  const user = await User.findById(req.user.id);
  const contact = await User.findById(invite.from);

  if (!user._id.equals(invite.to)) {
    res.status(500).json({ error: "server error" });
    return;
  }
  user.contacts.push(invite.from);
  contact.contacts.push(invite.to);
  user.invites = user.invites.filter(
    (userInvite) => !userInvite.equals(invite._id)
  );

  await Invite.deleteOne(invite);
  await user.save();
  await contact.save();

  res.json({ success: true });
});

exports.invite_reject = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.inviteID)) {
    res.status(500).json({ error: "invalid inputs" });
    return;
  }

  const invite = await Invite.findById(req.params.inviteID);
  const user = await User.findById(req.user._id);

  if (!user._id.equals(invite.to)) {
    res.status(500).json({ error: "server error" });
    return;
  }
  user.invites = user.invites.filter(
    (userInvite) => !userInvite.equals(invite._id)
  );

  await Invite.deleteOne(invite);
  await user.save();

  res.json({ success: true });
});
