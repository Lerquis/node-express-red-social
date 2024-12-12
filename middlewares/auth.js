// Importar dependencias o modulos
const jwt = require("jwt-simple");
const moment = require("moment");
// Importar clave secreta
const { secret } = require("../helpers/jwt");
// Funcion de autenticacion
exports.auth = (req, res, next) => {
  // Comprobar si llega la cabecera de autentiacion
  if (!req.headers.authorization)
    return res
      .status(403)
      .send({ status: 403, message: "Falta autenticacion en el header" });
  // Decodificar el token
  // Limpiamos el token
  let token = req.headers.authorization.replace(/['"]+/g, "");
  try {
    let payload = jwt.decode(token, secret);

    // Comprobar la expiracion del token
    if (payload.exp <= moment().unix())
      return res.status(401).json({ status: 401, message: "Token expirado" });

    // Agregamos los datos del user al request
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: 404,
      message: "Token invalido",
      error,
    });
  }

  // Pasar a ejecucion de accion (la accion del controlador)
  next();
};
