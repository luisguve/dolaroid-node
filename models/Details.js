const { Schema, model } = require("mongoose")

const SingleDetail = new Schema({
  date: {
    type: String,
    required: true
  },
  involved: String,
  subject: String,
  notes: String
})

const DetailsPair = new Schema({
  in: {
    type: SingleDetail,
    default: null
  },
  out: {
    type: SingleDetail,
    default: null
  }
})

const DetailSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  details: [DetailsPair]
})

module.exports = model("Details", DetailSchema)
