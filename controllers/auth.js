const bcrypt = require("bcryptjs")
const { nanoid } = require("nanoid")
const asyncWrapper = require("../middleware/async")
const { createCustomError } = require("../errors/custom-error")
const User = require("../models/User")

const saltRounds = 10

const indexAuth = (req, res) => {
  // Check whether the user is logged in
  const { session } = req
  const data = {
    isLoggedIn: session.user ? true : false,
    session: {...session.user},
    sendLocation: !session.location
  }
  return res.json(data)
}

const login = asyncWrapper(async (req, res, next) => {
  const { username, password } = req.body
  if (!username || !password) {
    return next(createCustomError("Invalid credentials", 400))
  }
  // Get user credentials from mongo
  const user = await User.findOne({username})
  if (!user) {
    return next(createCustomError("User unregistered", 401))
  }
  // Compare hash and password
  bcrypt.compare(password, user.password).then(equal => {
    if (!equal) return next(createCustomError("Invalid credentials", 401))
    // Save user in session
    const newSess = {
      username: user.username,
      typeOfAccount: user.type,
      userId: user.id
    }
    req.session = {
      ...req.session,
      user: {...newSess}
    }

    const data = {
      isLoggedIn: true,
      session: {...newSess},
      sendLocation: !req.session.location
    }

    res.status(200).json(data)
  })
})

const signup = asyncWrapper(async (req, res, next) => {
  const { username, password } = req.body
  if (!username || !password) {
    return next(createCustomError("Invalid credentials", 400))
  }
  // Check whether the username already exists
  let user = await User.findOne({username})
  if (user) {
    return next(createCustomError(`Username ${username} already taken`, 409))
  }

  const hash = await bcrypt.hash(password, saltRounds)
  const userID = nanoid()
  user = await User.create({
    username,
    password: hash,
    _id: userID
  })

  // Save user in session
  const newSess = {
    username: user.username,
    typeOfAccount: user.type,
    userId: user.id
  }
  req.session = {
    ...req.session,
    user: {...newSess}
  }

  const data = {
    isLoggedIn: true,
    session: {...newSess},
    sendLocation: !req.session.location
  }
  res.status(201).json(data)
})

const logout = asyncWrapper(async (req, res) => {
  req.session = {
    ...req.session,
    isLoggedIn: false,
    user: null
  }
  res.status(200).end()
})

const location = asyncWrapper(async (req, res, next) => {
  const { latt, longt } = req.body
  if (!latt | !longt) return next(createCustomError("Invalid coords", 400))
  req.session = {
    ...req.session,
    location: {
      latt,
      longt
    }
  }
  res.status(200).json(req.session.location)
})

module.exports = {
  indexAuth,
  login,
  signup,
  logout,
  location
}