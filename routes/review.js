const express = require("express")
const {
  getReview,
  postReview
} = require("../controllers/reviews")

const router = express.Router()

router.route("/review").get(getReview).post(postReview)

module.exports = router
