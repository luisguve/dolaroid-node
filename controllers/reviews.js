const asyncWrapper = require("../middleware/async")
const { createCustomError } = require("../errors/custom-error")
const Review = require("../models/Review")
const Details = require("../models/Details")

// Constants that represent the type of review being submitted
const GOOD_REVIEW = "Good review"
const BAD_REVIEW = "Bad review"
// Constants that represent the type of detail
const INCOMING_BILL = "incoming"
const OUTGOING_BILL = "outgoing"

const ErrReviewExists = createCustomError(
  "This user already posted a review of this type",
  409
)
const ErrInvalidFormat = createCustomError(
  "Invalid type of review",
  400
)
const ErrInvalidDetail = createCustomError(
  "Invalid type of detail",
  400
)
const ErrReviewNotFound = createCustomError(
  "Review not found",
  404
)
const ErrInvalidAccount = account => {
  return createCustomError(`Invalid type of account: ${account}`, 500)
}

const postReview = asyncWrapper(async (req, res, next) => {
  // Isn't the user logged in? Unauthorized
  const { session } = req
  if (!session.isLoggedIn) return res.status(401).end()

  // The location of the user is unknown? Bad request
  if (!session.location) return res.status(400).send("Location required")

  const { billInfo, review, typeOfReview } = req.body
  // Validations
  if (!billInfo) return res.status(400).send("Undefined billInfo")
  if (!review) return res.status(400).send("Undefined review")
  if (!typeOfReview) return res.status(400).send("Undefined type of review")

  const { serialNumber:sn, value, series } = billInfo
  const snTrim = sn.trim()
  const billID = `${snTrim}-${value}-${series}`

  review.userId = session.user.userId
  review.location = session.location

  // Get previous reviews
  let isNewReview = false
  let fullReview = await Review.findOne({_id: billID})
  if (!fullReview) {
    isNewReview = true
    fullReview = {
      billInfo,
      userReviews: {
        goodReviews: [],
        badReviews: []
      },
      businessReviews: {
        goodReviews: [],
        badReviews: []
      },
      defects: [],
      ratings: 0,
      avgRating: 0.0
    }
  }

  try {
    let target
    let update
    let updatedReview
    switch (session.user.typeOfAccount) {
      case "admin":
      case "regular":
      target = fullReview.userReviews

      switch (typeOfReview) {

        case GOOD_REVIEW:
        update = updateGoodReviews
        break

        case BAD_REVIEW:
        update = updateBadReviews
        break

        default:
        return next(ErrInvalidFormat)
      }

      updatedReview = await update(fullReview, target, review)
      fullReview = updatedReview.fullReview
      fullReview.userReviews = updatedReview.target

      break

      case "business":
      target = fullReview.businessReviews

      switch (typeOfReview) {

        case GOOD_REVIEW:
        update = updateGoodReviews
        break

        case BAD_REVIEW:
        update = updateBadReviews
        break

        default:
        return next(ErrInvalidFormat)
      }

      updatedReview = await update(fullReview, target, review)
      fullReview = updatedReview.fullReview
      fullReview.businessReviews = updatedReview.target

      break
      default:
      return next(ErrInvalidAccount(session.user.typeOfAccount))
    }
  } catch(err) {
    return next(err)
  }
  // Save review to the database
  if (isNewReview) {
    await Review.create({
      _id: billID,
      ...fullReview
    })
  } else {
    await Review.findOneAndUpdate({_id: billID}, fullReview, {
      new: true,
      runValidators: true
    })
  }
  const { details } = req.body
  if (details) {
    const data = details.detailsData
    const detailsID = `${review.userId}-${billID}`
    let fullDetails = await Details.findOne({_id: detailsID})
    let storedDetails = []
    if (fullDetails) {
      storedDetails = fullDetails.details
    }
    switch (details.typeOfDetail) {
      case INCOMING_BILL:
      storedDetails.push({
        in: {
          ...data
        }
      })
      break
      case OUTGOING_BILL:
      // If there are no details or if the last detail pair already has
      // an outgoing detail, then create a new detail pair.
      const last = storedDetails.length - 1
      if (!storedDetails.length || storedDetails[last].out) {
        storedDetails.push({
          out: {
            ...data
          }
        })
      } else {
        storedDetails[last].out = {...data}
      }
      break
      default:
      return next(ErrInvalidDetail)
    }
    fullDetails = fullDetails ?
      await Details.findOneAndUpdate(
        {
          _id: detailsID
        },
        {
          details: storedDetails
        },
        {
          new: true,
          runValidators: true
        }
      )
      :
      await Details.create({_id: detailsID, details: storedDetails})
    if (!fullDetails) {
      return next(createCustomError("Could not save details", 500))
    }
  }
  res.status(201).end()
})

const getReview = asyncWrapper(async (req, res, next) => {
  const { sn, value, series } = req.query
  const billInfo = {
    serialNumber: sn,
    value,
    series
  }
  // Validations
  if (!sn) return res.status(400).send("Undefined serial number")
  if (!value) return res.status(400).send("Undefined value")
  if (!series) return res.status(400).send("Undefined series")

  // Remove whitespaces from serial number.
  const snTrim = sn.trim()

  // Build _id
  const billID = `${snTrim}-${value}-${series}`

  // Query reviews
  const fullReview = await Review.findOne({_id: billID})
  if (!fullReview) {
    return next(ErrReviewNotFound)
  }
  const good = fullReview.userReviews.goodReviews +
    fullReview.businessReviews.goodReviews
  const bad = fullReview.userReviews.badReviews +
    fullReview.businessReviews.badReviews

  // Isn't the user logged in?
  if (!req.session.isLoggedIn) {
    // Send a basic review
    return res.json({
      billInfo,
      goodReviews: good,
      badReviews: bad,
      avgRating: fullReview.avgRating
    })
  }

  // Try to fetch details
  const detailsID = `${req.session.user.userId}-${billID}`
  const fullDetails = await Details.findOne({_id: detailsID})
  return res.json({
    billInfo,
    ...fullReview,
    details: fullDetails.details
  })
})

const updateBadReviews = (fullReview, targetReviews, review) => {
  return new Promise((resolve, reject) => {
    const fullReviewCopy = Object.assign({}, fullReview)
    const reviews = [...targetReviews.badReviews]
    // Allow only 1 review per user
    for (storedReview of reviews) {
      if (storedReview.userId === review.userId) {
        reject(ErrReviewExists)
      }
    }
    // Update defects; if the defect's not there, append it
    for (defect of review.defects) {
      let found = false
      for (storedDefect of fullReview.defects) {
        if (defect === storedDefect) {
          found = true
          break
        }
      }
      if (!found) {
        fullReviewCopy.defects.push(defect)
      }
    }
    // Push review to this bill's list of bad reviews
    reviews.push(review)
    resolve({
      fullReview: fullReviewCopy,
      target: {
        ...targetReviews,
        badReviews: reviews
      }
    })
  })
}

const updateGoodReviews = (fullReview, targetReviews, review) => {
  return new Promise((resolve,reject) => {
    const fullReviewCopy = Object.assign({}, fullReview)
    const reviews = [...targetReviews.goodReviews]
    // Allow only 1 review per user
    for (storedReview of reviews) {
      if (storedReview.userId === review.userId) {
        reject(ErrReviewExists)
        return
      }
    }
    // Update ratings and avg rating
    let totalReviews = fullReview.userReviews.goodReviews.length
    totalReviews += fullReview.businessReviews.goodReviews.length
    totalReviews++ // Add this review
    fullReviewCopy.ratings += review.rating
    fullReviewCopy.avgRating = fullReviewCopy.ratings / totalReviews
    // Push review to this bill's list of good reviews
    reviews.push(review)
    resolve({
      fullReview: fullReviewCopy,
      target: {
        ...targetReviews,
        goodReviews: reviews
      }
    })
  })
}

module.exports = {
  getReview,
  postReview
}