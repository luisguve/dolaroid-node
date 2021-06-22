const { Schema, model } = require("mongoose")

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: [20, 'username can not be more than 20 characters'],
  },
  password: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: "regular"
  },
  _id: {
    type: String,
    required: true
  }
})

module.exports = model("User", UserSchema)
