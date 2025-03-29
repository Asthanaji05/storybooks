import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import express, { urlencoded, json } from 'express'
import mongoose from 'mongoose'
import { config } from 'dotenv'
import morgan from 'morgan'
import exphbs from 'express-handlebars'
import methodOverride from 'method-override'
import passport from 'passport'
import session from 'express-session'


import connectDB from './config/db.js'
import MongoStore from 'connect-mongo';


// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load config
config({ path: './config/config.env' })

// Passport config
import passportConfig from './config/passport.js'
passportConfig(passport)

connectDB()

const app = express()

// Body parser
app.use(urlencoded({ extended: false }))
app.use(json())

// Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      let method = req.body._method
      delete req.body._method
      return method
    }
  })
)

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Handlebars Helpers
import { formatDate, stripTags, truncate, editIcon, select } from './helpers/hbs.js'

// Handlebars
app.engine(
  '.hbs',
  exphbs.engine({
    helpers: {
      formatDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: 'main',
    extname: '.hbs',
  })
)
app.set('view engine', '.hbs')

// Sessions
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),

  })
)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

app.use(express.static(join(__dirname, 'public')))

// Routes
import indexRoutes from './routes/index.js'
import authRoutes from './routes/auth.js'
import storiesRoutes from './routes/stories.js'

app.use('/', indexRoutes)
app.use('/auth', authRoutes)
app.use('/stories', storiesRoutes)

const PORT = process.env.PORT || 3000

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
)
