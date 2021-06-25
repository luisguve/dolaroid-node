const app = require("express")()
const connectDB = require("./db/connect")
const env = require("dotenv").config()
if (env.error) {
  throw env.error
}
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
app.use(cookieSession({
  name: "sess",
  secret: process.env.SESS_KEY
}))

// Routes
app.use("/", [auth, review])

app.use((req, res) => res.status(404).send("Route does not exist"))
app.use(errorHandlerMiddleware)

const PORT = process.env.PORT || 8000

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(PORT, () => console.log(`listening on port ${PORT}`))
  } catch (err) {
    console.log(err)
  }
}

start()
