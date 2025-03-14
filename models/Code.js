const mongoose = require("mongoose");
const baseSchema = require("./Base");

const codeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
      index: { expires: "0s" },
    },
  },
  {
    timestamps: false,
  }
);

codeSchema.add(baseSchema);

const Code = mongoose.model("Code", codeSchema);
module.exports = Code;
