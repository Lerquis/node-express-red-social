// Importamos dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");
const rutasUser = require("./routes/user");
const rutasFollow = require("./routes/follow");
const rutasPublication = require("./routes/publication");

// Mensaje de bienvenida
console.log("API NODE para red social ARRANCADA");

// Conexion a la base de datos
connection();

// Servidor de Node
const app = express();
const puerto = 3900;

// Configurar el CORS
app.use(cors());

// Convertir los datos en JSON
app.use(express.json());
// Para los datos form-url-encoded
app.use(express.urlencoded({ extended: true }));

// Cargar las rutas
app.use("/api/user", rutasUser);
app.use("/api/follow", rutasFollow);
app.use("/api/publication", rutasPublication);

// !Ruta prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({ status: 200, message: "Exitoso" });
});

// Poner el servidor a escuchar peticiones http
app.listen(puerto, () => {
  console.log("Servidor de NODE corriendo en el puerto " + puerto);
});
