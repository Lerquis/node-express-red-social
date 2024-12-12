const mongoose = require("mongoose");

const connection = async () => {
  try {
    // De ultimo tenemos que poner el nombre de la coleccion
    await mongoose.connect("mongodb://localhost:27017/mi_red_social");
    console.log("Conectado correctamente a la base de datos 'mi_red_social'");
  } catch (error) {
    console.log(error);
    throw new Error("No se ha conectado a la base de datos");
  }
};

module.exports = connection;
