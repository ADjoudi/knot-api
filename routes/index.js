const express = require("express");
const router = express.Router();
const index_controller = require("../controllers/indexController");

router.get("/", index_controller.user_info_get);

router.get("/chat/:contactID", index_controller.chat_log_get);
router.post("/chat/:contactID", index_controller.chat_message_post);

router.get("/invites", index_controller.invites_get);
router.post("/invites/:contactID", index_controller.invite_send);
router.post("/invites/:inviteID/accept", index_controller.invite_accept);
router.post("/invites/:inviteID/reject", index_controller.invite_reject);

module.exports = router;
