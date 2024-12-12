const { Schema, model } = require("mongoose");
const mongoosePaginateV2 = require("mongoose-paginate-v2");

const FollowSchema = Schema({
  user: {
    type: Schema.ObjectId,
    ref: "User",
  },
  followed: { type: Schema.ObjectId, ref: "User" },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

// Seteamos el plugin de paginacion
FollowSchema.plugin(mongoosePaginateV2);

module.exports = model("Follow", FollowSchema, "follows");
