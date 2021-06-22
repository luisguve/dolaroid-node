const express = require("express")
const {
  indexAuth,
  login,
  signup,
  logout,
  location
} = require("../controllers/auth")

const router = express.Router()

router.get("/", indexAuth)
router.post("/login", login)
router.post("/signup", signup)
router.post("/logout", logout)
router.post("/location", location)

module.exports = router
