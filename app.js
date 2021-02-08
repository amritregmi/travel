const express = require('express')
const path = require('path')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoute')
const reviewRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const bookingController = require('./controllers/bookingController')

const app = express()

// heroku uses proxy to redirect our app's request, So trust heroku 
app.enable('trust proxy')

// set pug engine
app.set('view engine', 'pug')

// set or load  view engine 
app.set('views', path.join(__dirname, 'views'))

// GLOBAL MIDDLEWARE

// Cors Implementation
app.use(cors())

// normally browser sends an options request when there is a pre flight phase
// another http method we need to respond to 
app.options('*',cors())

// Middleware that servers static files
app.use(express.static(path.join(__dirname, 'public')))

// Sets Security HTTP headers
app.use(helmet())

// Loges request in Development Environment 
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}
// Limits request coming from same IP 
const limiter = rateLimit({
    // 100 req per hr 
    max: 100,
    windowMs: 60 * 60 * 1000, // 60 min in millisecond 
    message: 'Too many request from this IP, Try again after 1 hour'
})
app.use('/api', limiter) // applying limits to api

// Stripe web hook route, needs to be before parser coz, raw data is needed.
app.post(
    '/webhook-checkout',
    express.raw({ type: 'application/json' }),
    bookingController.webhookCheckout
)
// Body parser, reads data from body into req.body. Max size 10KB
app.use(express.json({
    limit: '10kb'
}))
// cookie parser, basically parses all cookies from incoming request
app.use(cookieParser())

// parses data coming from url encoded form (directly from html)
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}))

// Data sanitization to prevent from NOSQL query injection
app.use(mongoSanitize()) // calling this fn returns a middleware fn. 

// Data sanitization to prevent from XSS 
app.use(xss())

// Preventing parameter pollution, clears the query string. 
app.use(hpp({
    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage',
        'maxGroupSize', 'difficulty', 'price'
    ]
}))
// compression middleware function, works for text n json
app.use(compression())

// custom middleware 1 -TEST 
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString()
    if (req.cookies.jwt) console.log('**** cookie coming along *****')
    next()
})

// Route for front end 
app.use('/', viewRouter)

// booking router 
app.use('/bookings', bookingRouter)

// Rout for api 
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)


// if any of the routes are not handled then 
app.all('*', (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server`, 400)
    next(err)
})
/**
 * @DESC ERROR MIDDLEWARE FUNCTION
 * @EXPLAIN If any guy invokes next() function and passes error object,
 *          this middleware function is invoked automatically.
 *          and sends proper ERROR RESPONSE
 */
app.use(globalErrorHandler)

module.exports = app