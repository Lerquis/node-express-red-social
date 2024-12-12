const router = require("express").Router();
const UserController = require("../controllers/user");
const { auth } = require("../middlewares/auth");
const multer = require("multer");

// Configuracion de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/avatars/");
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}-${file.originalname}`);
  },
});

const uploads = multer({ storage });

// Definir las rutas

// Le agregamos el middleware de auth, para saber si el token esta bien
router.get("/prueba-user", auth, UserController.pruebaUser);

// ? GETS
router.get("/profile/:id", auth, UserController.profile);
// Como vamos a tener paginacion, pero es opcional
router.get("/user-list/:page?/:itemsPerPage?", auth, UserController.userList);
router.get("/avatar/:file", auth, UserController.avatar);
router.get("/count/:id?", auth, UserController.count);

// ? POSTS
router.post("/register", UserController.register);
router.post("/login", UserController.login);
// Para tener varios middlewares lo tenemos que meter en un array
// Para el multer (uploads) tenemos que decir si es solo un archivo o varios, en este caso single
// porque solo esperamos un archivo, ademas del nombre de como lo mandamos por el request, es decir
// en el request tenemos que tener un param 'file' donde enviaremos la imagen
router.post("/upload", [auth, uploads.single("file")], UserController.upload);

// ? PUTS

router.put("/update", auth, UserController.update);

module.exports = router;
