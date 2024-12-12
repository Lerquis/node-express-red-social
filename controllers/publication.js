// Imports
const Publication = require("../models/Publication");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followUserIds");

// Acciones de prueba
const pruebaPublication = (req, res) => {
  return res
    .status(200)
    .send({ message: "Mensaje enviado desde el controllador de publication" });
};

// Accion para guardar publication
const save = async (req, res) => {
  // Recoger datos del body
  const params = req.body;
  // Si no llegan, respuesta negativa
  if (!params.text)
    return res
      .status(400)
      .json({ status: 400, message: "No hay texto en los datos enviados" });
  // Crear y rellenar el objeto del modelo
  let newPublication = new Publication(params);
  newPublication.user = req.user.id;

  // Guardar el objeto en la base de datos
  const response = await newPublication.save();
  if (!response)
    return res
      .status(400)
      .json({ status: 400, message: "No se ha guardado la publicacion " });
  // Devovler respuesta
  return res.status(200).json({
    status: 200,
    publication: response,
  });
};

// Sacar una publicacion en concreto
const detail = async (req, res) => {
  // Sacamos el id de la publicacion
  const { id } = req.params;

  // Find con el id
  try {
    const publication = await Publication.findById(id);
    if (!publication)
      return res
        .status(404)
        .json({ status: 404, message: "Publicacion no encontrada" });
    // Devolver una respuesta
    return res.status(200).send({ status: 200, publication });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ status: 404, message: "Publicacion no encontrada" });
  }
};

// Listar todas las publicaciones
const listAll = async (req, res) => {
  // Obtenemos la pagina
  const { page } = req.params;

  // Numeros de elementos por pagina
  const itemsPerPage = 5;

  try {
    // Sacar un array de identificadores de usuarios que yo sigo como usuario identificado
    // Ya teniamos un servicio que hacia estyo
    const myFollows = await followService.followUserIds(req.user.id);

    // Find a publications con el operador in, ordenar, popular y paginar
    const followingPublications = await Publication.paginate(
      {
        user: [...myFollows.following, req.user.id],
      },
      {
        page: page ?? 1,
        limit: itemsPerPage,
        sort: [["created_at", "desc"]],
        populate: {
          path: "user",
          select: "-password -email -created_at -__v -email",
        },
      }
    );

    return res.status(200).json({
      status: 200,
      hasNextPage: followingPublications.hasNextPage,
      hasPrevPage: followingPublications.hasPrevPage,
      totalPublications: followingPublications.totalDocs,
      page: followingPublications.page,
      following: myFollows.following,
      publications: followingPublications.docs,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ status: 404, message: "Usuario no encontrado" });
  }
};

// Listar publicaciones de un usuario en concreto
const listByUser = async (req, res) => {
  // Sacar el id del usuario y paginacion
  const { id, page } = req.params;

  // Encontrar las publicaciones del usuario
  try {
    const response = await Publication.paginate(
      { user: id },
      {
        page: page ?? 1,
        limit: 5,
        sort: [["created_at", "desc"]],
        populate: { path: "user", select: "nick -_id -email" },
      }
    );

    // Devolver respuesta
    if (!response.docs.length)
      return res
        .status(200)
        .json({ status: 200, message: "El usuario no tiene publicaciones" });

    return res.status(200).json({
      status: 200,
      hasNextPage: response.hasNextPage,
      hasPrevPage: response.hasPrevPage,
      totalPublications: response.totalDocs,
      publications: response.docs,
    });
  } catch (error) {
    return res
      .status(404)
      .json({ status: 404, message: "No se encontraron publicaciones" });
  }
};

// Eliminar publicacion
const remove = async (req, res) => {
  // Obtener el id de la publicacion
  const { id } = req.params;
  // Find y luego el remove. Verificamos que la publicacion sea borrada solo por el creador
  try {
    let response = await Publication.findOne({
      user: req.user.id,
      _id: id,
    });
    // Tenemos que saber si la publicacion que eliminamos tenia alguna imagen, y si es asi, eliminarla
    // El String.fromCharCode es para saacar el ascii de \\
    if (response.file) {
      fs.unlinkSync(
        `uploads${
          String.fromCharCode(92) + String.fromCharCode(92)
        }publications${
          String.fromCharCode(92) + String.fromCharCode(92) + response.file
        }`
      );
    }
    response = await response.deleteOne();
    // Devolver respuesta

    if (response.deletedCount === 0)
      return res
        .status(404)
        .json({ status: 404, message: "No existe la publicacion" });

    return res
      .status(200)
      .json({ status: 200, publicationDeleted: response.deletedCount > 0 });
  } catch (error) {
    return res
      .status(404)
      .json({ status: 404, message: "La publicacion no existe" });
  }
};

// Subir ficheros
const upload = async (req, res) => {
  // Recogemos el id de la publicacion
  const { id } = req.params;
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
    const publicationUpdated = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: id },
      {
        file: req.file.filename,
      },
      { new: true }
    );
    // Devolver respuesta
    if (!publicationUpdated) {
      // Si no se sube, tenemos que eliminar la imagen tambien
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 400,
        message: "Algo fallo actualizando la publicacion",
      });
    }

    return res.status(200).json({
      status: 200,
      file: req.file,
      publicationUpdated,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: 400,
      message: "Publicacion no encontrada",
    });
  }
};

// Devolver archivos multimedia imagenes
const show = (req, res) => {
  // Sacar el parametro de la url
  const { file } = req.params;
  // Montar el path real de la imagen
  const filePath = `./uploads/publications/${file}`;
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

module.exports = {
  pruebaPublication,
  save,
  detail,
  listAll,
  listByUser,
  remove,
  upload,
  show,
};
