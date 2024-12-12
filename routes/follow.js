const router = require("express").Router();
const FollowController = require("../controllers/follow");
const { auth } = require("../middlewares/auth");

// Definir las rutas

// ? Get
router.get("/prueba-follow", FollowController.pruebaFollow);
router.get("/following/:id?/:page?", auth, FollowController.followingList);
router.get("/followers/:id?/:page?", auth, FollowController.followersList);

// ? Post
router.post("/save", auth, FollowController.saveFollow);

// ? Put

// ? Delete
router.delete("/delete", auth, FollowController.deleteFollow);

module.exports = router;
