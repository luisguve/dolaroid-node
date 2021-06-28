const { Schema, model } = require("mongoose")

const BaseReviewSchema = new Schema({
  date: {
    type: String,
    required: true
  },
  comment: String,
  userId: {
    type: String,
    required: true
  },
  location: {
    latt: {type: String, required: true},
    longt: {type: String, required: true}
  }
})

const GoodReviewSchema = new Schema()
GoodReviewSchema.add(BaseReviewSchema).add({
  rating: {
    type: Number,
    required: true
  }
})

const BadReviewSchema = new Schema()
BadReviewSchema.add(BaseReviewSchema).add({
  defects: {
    type: [String],
    required: true
  }
})

const BillSchema = new Schema({
  serialNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [13, "Serial number can not be more than 13 characters"],
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
})

const ReviewSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  billInfo: BillSchema,
  userReviews: {
    goodReviews: [GoodReviewSchema],
    badReviews: [BadReviewSchema]
  },
  businessReviews: {
    goodReviews: [GoodReviewSchema],
    badReviews: [BadReviewSchema]
  },
  defects: [String],
  ratings: {type: Number, default: 0},
  avgRating: {type: Number, default: 0}
})

module.exports = model("Review", ReviewSchema)
