const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const Message = require("../models/Message");
const Invite = require("../models/Invite");

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
    return res.status(400).json({ error: "invalid user" });
  }

  const invites = await Invite.find({ to: req.user._id })
    .populate({ path: "from", select: "_id display_name" })
    .lean()
    .exec();

  const uniqueInvites = invites.filter(
    (invite) => !req.user.contacts.includes(invite.from._id)
  );

  res.json(uniqueInvites);
});

exports.invite_send = asyncHandler(async function (req, res, next) {
  if (!req.user || !mongoose.isValidObjectId(req.params.contactID)) {
    return res.status(400).json({ error: "invalid inputs" });
  }

  const existingInvite = await Invite.findOne({
    from: req.user.id,
    to: req.params.contactID,
  })
    .lean()
    .exec();

  if (existingInvite)
    return res.status(400).json({ error: "Invite already sent" });

  const newInvite = new Invite({
    from: req.user.id,
    to: req.params.contactID,
  });
  const invite = await newInvite.save();

  const contact = await User.findById(req.params.contactID);
  if (contact) {
    if (!contact.invites.includes(invite._id)) {
      contact.invites.push(invite._id);
      await contact.save();
    }
  } else {
    return res.status(404).json({ error: "Recipient not found" });
  }

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

  if (
    !user.contacts.includes(invite.from) &&
    !contact.contacts.includes(invite.to)
  ) {
    user.contacts.push(invite.from);
    contact.contacts.push(invite.to);

    user.invites = user.invites.filter(
      (userInvite) => !userInvite.equals(invite._id)
    );

    await Invite.deleteOne(invite);
    await user.save();
    await contact.save();

    res.json({ success: true });
  }
  res.sendStatus(500);
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

exports.contacts_list_get = asyncHandler(async function (req, res, next) {
  const allUsers = await User.find()
    .limit(10)
    .select("_id display_name invites")
    .populate({ path: "invites", select: "from" })
    .lean()
    .exec();

  const contacts = allUsers.filter((user) => {
    const exists = user.invites.filter((invite) =>
      invite.from.equals(req.user._id)
    );
    return (
      !req.user.contacts.includes(user._id) &&
      exists.length === 0 &&
      req.user._id.toString() !== user._id.toString()
    );
  });

  res.json(contacts);
});
