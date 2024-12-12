const { Schema, model } = require("mongoose");
const mongoosePaginateV2 = require("mongoose-paginate-v2");

const PublicationSchema = Schema({
  user: { type: Schema.ObjectId, ref: "User" },
  text: {
    type: String,
    required: true,
  },
  file: String,
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

PublicationSchema.plugin(mongoosePaginateV2);

module.exports = model("Publication", PublicationSchema, "publications");
