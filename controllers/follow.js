// Imports
const Follow = require("../models/Follow");
const User = require("../models/User");
const followService = require("../services/followUserIds");

// Acciones de prueba
const pruebaFollow = (req, res) => {
  return res
    .status(200)
    .send({ message: "Mensaje enviado desde el controllador de follow" });
};

const saveFollow = async (req, res) => {
  // Sacar los datos que llegan por el body
  const { followed } = req.body;
  if (followed === req.user.id)
    return res
      .status(400)
      .json({ status: 400, message: "No se puede seguir a si mismo" });

  // Verificar si ya existe el follow
  const followExist = await Follow.find({
    $and: [
      {
        user: req.user.id,
      },
      { followed },
    ],
  });
  if (followExist.length != 0) {
    return res
      .status(400)
      .json({ status: 400, message: "This follow already exist" });
  }

  // Crear modelo con objeto follow
  let userToFollow = new Follow({
    user: req.user.id,
    followed,
  });

  const response = await userToFollow.save();

  if (!response)
    return res
      .status(400)
      .json({ status: 400, message: "No se ha podido seguir al usuario" });

  // Guardar objeto en la base de datos
  return res.status(200).send({
    status: 200,
    message: "Accion de salvar el follow",
    followed,
    user: req.user.id,
    dataFollow: response,
  });
};

const deleteFollow = async (req, res) => {
  // Sacar los datos que llegan por el body
  const { followed } = req.body;
  // Encontrar y borrar el follow

  try {
  } catch (error) {}
  const followRemove = await Follow.find({
    user: req.user.id,
    followed,
  }).deleteOne();

  if (!followRemove.deletedCount > 0)
    return res
      .status(400)
      .json({ status: 400, message: "This follow doesnt exist" });

  return res.status(200).json({ status: 200, message: "Follow eliminado" });
};

// Sacar la lista de usuarios que sigo
const followingList = async (req, res) => {
  // Sacar el id del usuario
  let userId = req.user.id;
  // Comprobar si llega el id por parametro
  if (req.params.id) userId = req.params.id;

  // Comprobar si me llega la pagina
  let page = 1;
  if (req.params.page) page = req.params.page;
  // Usuarios por pagina quiero mostrar
  const itemsPerPage = 5;

  try {
    // Find a follow, popular datos de los usuarios, paginar con moongose pagination

    const follows = await Follow.paginate(
      { user: userId }, // El query de lo que queremos buscar
      // El populate sirve para llenar los datos que tienen el _id de otra coleccion.
      // En este caso como le user y followed son ids de users, nos traera la informacion
      // Utilizamos el select con un menos para decir que campos no nos traiga de esa collection
      // En este caso no queremos traer la contrasena del usuario
      {
        page,
        limit: itemsPerPage,
        populate: { path: "user followed", select: "-password -role -__v" },
      }
    );

    if (!follows.totalDocs)
      return res.status(400).json({ status: 400, message: "No hay follows" });

    // Extra
    // Sacar array de ids de los usuarios que me siguen y los que sigo (desde la cuenta
    // que esta logueada)
    let followUserIds = await followService.followUserIds(req.user.id);

    return res.status(200).send({
      status: 200,
      totalPages: follows.totalPages,
      currentPage: follows.page,
      hasPrevPage: follows.hasPrevPage,
      hasNextPage: follows.hasNextPage,
      follows: follows.docs,
      user_following: followUserIds.following,
      user_followers: followUserIds.followers,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ status: 404, message: "El usuario no fue encontrado" });
  }
};

// Sacar la lista de usuarios que me siguen
const followersList = async (req, res) => {
  // Sacar el id del usuario
  let userId = req.user.id;
  // Comprobar si llega el id por parametro
  if (req.params.id) userId = req.params.id;

  // Comprobar si me llega la pagina
  let page = 1;
  if (req.params.page) page = req.params.page;
  // Usuarios por pagina quiero mostrar
  const itemsPerPage = 5;

  try {
    // Find a follow, popular datos de los usuarios, paginar con moongose pagination

    const follows = await Follow.paginate(
      { followed: userId }, // El query de lo que queremos buscar
      // El populate sirve para llenar los datos que tienen el _id de otra coleccion.
      // En este caso como le user y followed son ids de users, nos traera la informacion
      // Utilizamos el select con un menos para decir que campos no nos traiga de esa collection
      // En este caso no queremos traer la contrasena del usuario
      {
        page,
        limit: itemsPerPage,
        populate: {
          path: "user followed",
          select: "-password -role -__v -email",
        },
      }
    );

    if (!follows.totalDocs)
      return res.status(400).json({ status: 400, message: "No hay follows" });

    // Extra
    // Sacar array de ids de los usuarios que me siguen y los que sigo (desde la cuenta
    // que esta logueada)
    let followUserIds = await followService.followUserIds(req.user.id);

    return res.status(200).send({
      status: 200,
      totalPages: follows.totalPages,
      currentPage: follows.page,
      hasPrevPage: follows.hasPrevPage,
      hasNextPage: follows.hasNextPage,
      follows: follows.docs,
      user_following: followUserIds.following,
      user_followers: followUserIds.followers,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  pruebaFollow,
  saveFollow,
  deleteFollow,
  followingList,
  followersList,
};
