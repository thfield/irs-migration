var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

var index = require('./routes/index')
var county = require('./routes/county')
var allcounties = require('./routes/allcounties')
var lineshape = require('./routes/lineshape')
var topojson = require('./routes/topojson')
var migration = require('./routes/migration')
var explore = require('./routes/explore')
var state = require('./routes/state')
var baz = require('./routes/baz')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)
app.use('/api/county', county)
app.use('/api/allcounties', allcounties)
app.use('/api/lineshape', lineshape)
app.use('/api/topojson', topojson)
app.use('/api/migration', migration)
app.use('/explore', explore)
app.use('/api/state', state)
app.use('/baz', baz)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
