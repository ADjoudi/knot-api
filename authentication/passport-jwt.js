const passport = require("passport");
const User = require("../models/User");
const jwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

require("dotenv").config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

const jwt = passport.use(
  new jwtStrategy(options, async function (jwt_payload, done) {
    try {
      const user = await User.findOne({
        _id: jwt_payload.id,
      });
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

module.exports = jwt;
