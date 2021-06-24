const { Schema, model } = require("mongoose")

const GoodReviewSchema = new Schema({
  date: {
    type: String,
    required: true
  },
  comment: String,
  rating: {
    type: Number,
    required: true
  }
})

const BadReviewSchema = new Schema({
  date: {
    type: String,
    required: true
  },
  comment: String,
  defects: {
    type: [String],
    required: true
  }
})
/*
const SingleReviewSchema = new Schema({
  date: {
    type: String,
    required: true
  },
  comment: String,
  rating: Number,
  defects: [String]
})
*/
const ReviewSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  billInfo: {
    serialNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: [12, "Serial number can not be more than 12 characters"],
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    series: {
      type: String,
      required: true,
      trim: true
    }
  },
  userReviews: {
    goodReviews: [GoodReviewSchema],
    badReviews: [BadReviewSchema]
  },
  businessReviews: {
    goodReviews: [GoodReviewSchema],
    badReviews: [BadReviewSchema]
  },
  defects: [String],
  ratings: Number,
  avgRating: Number
})

module.exports = model("Review", ReviewSchema)
