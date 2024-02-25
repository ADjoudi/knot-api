const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport_jwt = require("./authentication/passport-jwt");
const dotenv = require("dotenv");
const connectDB = require("./database/chatDB");
const cors = require("cors");

dotenv.config();

connectDB();

const authRouter = require("./routes/auth");
const indexRouter = require("./routes/index");

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRouter);
app.use(
  "/users",
  passport_jwt.authenticate("jwt", { session: false }),
  indexRouter
);

module.exports = app;
