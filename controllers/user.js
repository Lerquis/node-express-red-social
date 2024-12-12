// Importar dependencias y modulos
const User = require("../models/User");
const bcrypt = require("bcrypt");
const { createToken } = require("../helpers/jwt");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followUserIds");
const Follow = require("../models/Follow");
const Publication = require("../models/Publication");
const validate = require("../helpers/validate");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controllador de user",
    // Podemos enviar req.user, porque desde el middleware, hicimos un req.user = payload
    user: req.user,
  });
};

// Registro de usuario
const register = async (req, res) => {
  // Recoger datos de la peticion
  const params = req.body;

  // Comprobar que llegan los valores bien + validacion
  if (!params.name || !params.email || !params.password || !params.nick)
    return res.status(400).json({ status: 400, message: "Faltan valores" });

  // Validacion avanzada con validator
  if (!validate(params))
    return res
      .status(400)
      .json({ status: 400, message: "Validacion avanzada no superada" });

  // Crear objeto de usuario
  let user_to_save = new User(params);

  // Control de usuarios duplicados
  User.find({
    $or: [
      { email: user_to_save.email.toLowerCase() },
      { nick: user_to_save.nick },
    ],
  })
    .exec()
    .then(async (users) => {
      if (users && users.length >= 1)
        return res.status(400).send({
          status: 400,
          message: "El usuario ya existe",
        });

      // Cifrar la contrasena
      // El primer parametro es lo que se va a hashear, el segundo es las veces que se va a realizar
      // el hasheo y el por ultimo el callback
      let password_hashed = await bcrypt.hash(user_to_save.password, 10);
      user_to_save.password = password_hashed;

      // Guardar usuario en la base de datos
      user_to_save.save().then((saved_user) => {
        // Devolver resultado
        if (!saved_user)
          return res
            .status(400)
            .json({ status: 400, message: "Error guardando el usuario" });
        return res.status(200).json({
          status: 200,
          message: "Usuario registrado correctamente",
          saved_user,
        });
      });
    });
};

const login = async (req, res) => {
  // Recoger los parametros
  let params = req.body;
  if (!params.email || !params.password)
    return res
      .status(404)
      .json({ status: 404, message: "Faltan datos por enviar" });
  // Buscar en la base de datos si existe el usuario
  // El select lo que hace es devolvernos la informacion que queramos del modelo. 0 no lo devuelve,
  // 1 si. Aca utilizamos __v como ejemplo, ya que es un dato irrelevante que inyecta mongo
  User.findOne({ email: params.email })
    .select({ __v: 0 })
    .exec()
    .then((user) => {
      if (!user)
        return res
          .status(404)
          .json({ status: 404, message: "No existe el usuario" });
      // Comprobar su contrasena
      let password = bcrypt.compareSync(params.password, user.password);
      if (!password)
        return res
          .status(400)
          .json({ status: 400, message: "Contrasena o correo incorrecto" });
      // Devolver el token
      const token = createToken(user);

      // Devolver datos del usuario
      return res.status(200).json({
        status: 200,
        user: {
          name: user.name,
          nick: user.nick,
          id: user._id,
        },
        token,
      });
    });
};

const profile = async (req, res) => {
  //Recibir el parametro del id de usuario por la url
  const id = req.params.id;
  // Consulta para sacar los datos del usuario
  // Lo hacemos dentro de un try catch, porque parece que si no encuentra el id, crashea la app
  try {
    let userProfile = await User.findById(id)
      .select({ password: 0, role: 0 })
      .exec();
    if (!userProfile) {
      return res.status(404).send({
        status: "error",
        message:
          "The user you are trying to log in with does not exist or there is an error.",
      });
    }

    // Info de seguimiento
    let followInfo = null;
    if (req.user.id !== id)
      followInfo = await followService.followThisUser(req.user.id, id);
    else followInfo = "Is the same user";
    //Devolver el resultado
    //Posteriormente devolver informacion del follower
    return res.status(200).send({
      status: "Success",
      user: userProfile,
      followInfo,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ status: 400, message: "Usuario no encontrado" });
  }
};

const userList = async (req, res) => {
  // Controlar en que pagina estamos
  let page = req.params.page ? parseInt(req.params.page) : 1;
  let itemsPerPage = req.params.itemsPerPage
    ? parseInt(req.params.itemsPerPage)
    : 5;

  // Consulta con mongoose pagination v2
  // url del package para ver la documentacion
  // https://www.npmjs.com/package/mongoose-paginate-v2
  User.paginate(
    {},
    {
      page,
      limit: itemsPerPage,
      sort: [["_id", "desc"]],
      select: "-password -email",
    }
  ).then(async (response) => {
    if (!response)
      return res
        .status(400)
        .json({ status: 400, message: "There is no users" });
    // Sacar array de ids de los usuarios que me siguen y los que sigo (desde la cuenta
    // que esta logueada)
    let followUserIds = await followService.followUserIds(req.user.id);
    return res.status(200).json({
      status: 200,
      page,
      itemsPerPage,
      totalPages: response.totalPages,
      totalUsers: response.totalDocs,
      nextPage: response.nextPage,
      prevPage: response.prevPage,
      users: response.docs,
      user_following: followUserIds.following,
      user_followers: followUserIds.followers,
    });
  });
};

const update = (req, res) => {
  // Recoger info del usuario a actualizar
  // Recordemos que sacamos la info del usuario gracias al middleware
  const userIdentity = req.user;
  const userToUpdate = req.body;
  // Eliminamos del objeto los valores que no nos importan
  delete userIdentity.iat;
  delete userIdentity.exp;
  delete userIdentity.role;
  delete userIdentity.image;

  // Comprobar si el usuario existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick },
    ],
  })
    .exec()
    .then(async (users) => {
      // Esto lo hacemos, para verificar si el usuario que vamos a editar es el mismo, asi puede
      // cambiar si correo o nick sin problemas. Es decir, si yo envio en el nick Lerq desde la cuenta
      // de Lerq, no hay problema, pero si lo hago desde la cuenta de Juanito, si hay problema

      let userIsset = false;

      users.forEach((user) => {
        if (user && !user._id.toString().includes(userIdentity.id))
          userIsset = true;
      });

      if (userIsset)
        return res.status(400).send({
          status: 400,
          message: "El usuario ya existe",
        });

      // Si me llega password, cifrar
      if (userToUpdate.password) {
        let password_hashed = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = password_hashed;
      } else delete userToUpdate.password;

      // Tenemos que hacerlo dentro de un try-catch y con variable, para que la aplicacion
      // no crashee si no encuentra el usuario
      try {
        // Buscar y Actualizar y devolver el nuevo sin los datos innecesarios o privados
        const userUpdated = await User.findByIdAndUpdate(
          { _id: userIdentity.id },
          userToUpdate,
          {
            new: true,
          }
        ).select({ password: 0, role: 0, __v: 0 });
        if (!userUpdated)
          return res.status(400).json({
            status: 400,
            message: "No se pudo actualizar el usuario",
          });
        // Devolver respuesta
        return res.status(200).json({ status: 200, newUser: userUpdated });
      } catch (error) {
        return res.status(404).json({
          status: 400,
          message: "No existe el usuario a modificar",
        });
      }
    });
};

const upload = async (req, res) => {
  // Recoger el fichero de imagen y comprobar que existe
  if (!req.file)
    return res
      .status(404)
      .json({ status: 404, message: "Peticion no incluye la imagen" });

  // Conseguir el nombre del archivo
  let image = req.file.originalname;

  // Extension y comprobar la extension
  let extention = image.split(".");
  // Hacemos la comprobacion con el length, por si la imagen tiene puntos en el nombre
  if (
    !["jpg", "png", "jpeg", "gif"].includes(extention[extention.length - 1])
  ) {
    // Si no es correcta, eliminamos el archivo
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      status: 400,
      message: "Extension del fichero invalida",
    });
  }
  // Si es correcta, guardar la imagen en la base de datos
  try {
    const userUpdated = await User.findOneAndUpdate(
      { _id: req.user.id },
      {
        image: req.file.filename,
      },
      { new: true }
    );
    // Devolver respuesta
    if (!userUpdated)
      return res.status(400).json({
        status: 400,
        message: "Algo fallo actualizando el usuario",
      });
    return res.status(200).json({
      status: 200,
      file: req.file,
      userUpdated,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "Usuario no encontrado",
    });
  }
};

const avatar = (req, res) => {
  // Sacar el parametro de la url
  const { file } = req.params;
  // Montar el path real de la imagen
  const filePath = `./uploads/avatars/${file}`;
  // Comprobar que el archivo existe
  fs.stat(filePath, (error, exist) => {
    // Si existe, devolvermos el file
    if (!exist)
      return res
        .status(404)
        .json({ status: 404, message: "La imagen no existe" });

    // Tiene que tener un path muy especifico, entonces con la libreria de path, le pasamos el path
    // y asi accedemos a ese path y nos devuelve la imagen
    return res.sendFile(path.resolve(filePath));
  });
};

const count = async (req, res) => {
  // Sacamos el id
  const { id } = req.params;

  try {
    // Sacamos el conteo de informacion del perfil
    const following = await Follow.countDocuments({ user: id ?? req.user.id });
    const followers = await Follow.countDocuments({
      followed: id ?? req.user.id,
    });
    const publications = await Publication.countDocuments({
      user: id ?? req.user.id,
    });

    // Devolvemos respuesta
    return res.status(200).json({
      status: 200,
      id: id ?? req.user.id,
      following,
      followers,
      publications,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ status: 404, message: "Usuario no encontrado" });
  }
};

// Exportar acciones
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  userList,
  update,
  upload,
  avatar,
  count,
};
