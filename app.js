const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const passport_jwt = require("./authentication/passport-jwt");
const dotenv = require("dotenv");
const connectDB = require("./database/chatDB");

dotenv.config();

connectDB();

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRouter);
// app.use("/users/:id", passport_jwt.authenticate("jwt", { session: false }));

module.exports = app;
