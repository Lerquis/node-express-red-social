const { Schema, model } = require("mongoose");
const mongoosePaginateV2 = require("mongoose-paginate-v2");

const UserSchema = Schema({
  name: {
    required: true,
    type: String,
  },
  surname: String,
  bio: String,
  nick: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "role_user",
  },
  image: {
    type: String,
    default: "default.png",
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

// Seteamos el plugin de paginacion
UserSchema.plugin(mongoosePaginateV2);

module.exports = model("User", UserSchema, "users");
