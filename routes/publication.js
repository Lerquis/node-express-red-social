const router = require("express").Router();
const PublicationController = require("../controllers/publication");
const { auth } = require("../middlewares/auth");
const multer = require("multer");

// Configuracion de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/publications/");
  },
  filename: (req, file, cb) => {
    cb(null, `pub-${Date.now()}-${file.originalname}`);
  },
});

const uploads = multer({ storage });

// Definir las rutas

// ? GET
router.get("/prueba-publication", PublicationController.pruebaPublication);
router.get("/detail/:id", auth, PublicationController.detail);
router.get(
  "/publication_by_user/:id/:page?",
  auth,
  PublicationController.listByUser
);
router.get("/show/:file", auth, PublicationController.show);
router.get("/feed/:page?", auth, PublicationController.listAll);

// ? POST
router.post("/save", auth, PublicationController.save);
router.post(
  "/upload/:id",
  [auth, uploads.single("file")],
  PublicationController.upload
);

// ? PUT

// ? DELETE
router.delete("/delete/:id", auth, PublicationController.remove);

module.exports = router;
