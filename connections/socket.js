/**
 * create socket io
 */

const Message = require("../models/Message");
const { Server } = require("socket.io");

exports.initSocket = (server) => {
  const io = new Server(server, { cors: "*" });

  io.on("connection", (socket) => {
    socket.on("update", async (arg) => {
      const { userID, contactID } = arg;
      const messages = await Message.find({
        $or: [
          { from: userID, to: contactID },
          { from: contactID, to: userID },
        ],
      })
        .populate({ path: "from to", select: "_id display_name" })
        .sort({ date: 1 })
        .lean(true)
        .exec();
      io.emit("messages", messages);
    });
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
