// Importar dependencias
const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta
const secret = "clave_secreta_del_proyect_red_social";

// Crear funcion para generar tokens
const createToken = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    surname: user.surname,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    // El momento en el que se creo el token
    iat: moment().unix(),
    // Momento donde se expira el token
    exp: moment().add(30, "days").unix(),
  };
  // Devolver JWT codificado
  return jwt.encode(payload, secret);
};

module.exports = { createToken, secret };
