const app = require("express")()
const connectDB = require("./db/connect")
if (!process.env) {
  let envErr = require("dotenv").config().error
  if (envErr) {
    throw envErr
  }
}
const env = process.env
// Middleware
const cors = require("cors")
const cookieSession = require("cookie-session")
const bodyParser = require("body-parser")
const errorHandlerMiddleware = require("./middleware/error-handler")
// Routes
const auth = require("./routes/auth")
const review = require("./routes/review")

// Middleware to read JSON and form data from request body,
// so that they are available in req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.use(cors({
  origin: ["http://localhost:3000", "https://dolaroid.netlify.app"],
  credentials: true
}))
const sessKey = env.SESS_KEY
if (!sessKey) {
  throw "Must provide session key"
}
app.use(cookieSession({
  name: "sess",
  secret: sessKey
}))

// Routes
app.use("/", [auth, review])

app.use((req, res) => res.status(404).send("Route does not exist"))
app.use(errorHandlerMiddleware)

const PORT = env.PORT || 8000

const start = async () => {
  try {
    await connectDB(env.MONGO_URI)
    app.listen(PORT, () => console.log(`listening on port ${PORT}`))
  } catch (err) {
    console.log(err)
  }
}

start()
