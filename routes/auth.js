const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const local = require("../authentication/local");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

router.post("/signup", [
  body("name").trim().escape(),
  body("email").trim().escape(),
  body("password").trim().escape(),
  async function (req, res, next) {
    const errors = validationResult(req);
    const user = {
      display_name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    };

    if (!errors.isEmpty()) {
      res.json({ error: errors });
      return;
    }
    const users = await User.find({ email: req.body.email });
    if (users.length) {
      res.json({ error: "Email already in use" });
      return;
    }
    try {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          res.json({ error: "Server Error" });
          return;
        }
        user.password = hashedPassword;
        const newUser = new User(user);
        await newUser.save();
        const token = jwt.sign({ id: newUser._id }, process.env.SECRET, {
          expiresIn: "1h",
        });
        res.json({ token });
      });
    } catch (err) {
      next(err);
    }
  },
]);

router.post(
  "/login",
  local.authenticate("local", { session: false }),
  function (req, res, next) {
    const token = jwt.sign({ id: req.user._id }, process.env.SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
    return;
  }
);

module.exports = router;
