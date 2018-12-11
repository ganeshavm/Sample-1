const express = require('express')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session= require('express-session');
const passport= require('passport');
const path = require('path');
const csrf = require('csurf');
const helmet = require('helmet');

// Initialize Express
const app = express();

// Use Helmet to protect from malformed HTTP headers
app.use(helmet());

// CSRF Protection
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrf({ cookie: true }));

//Load Routes
const ideas = require('./routes/ideas');
const users = require('./routes/users');

// Passport Config
require('./config/passport')(passport);

//DB Config
const db = require('./config/database');

//Map global promise - to get rid off warnings
mongoose.Promise = global.Promise;

// connect to mongoose
mongoose.connect(db.mongoURI, {
//  useMongoClient: true
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err));

const exphbs= require('express-handlebars');
//Handlebars MiddleWare
app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

// Body Parser MiddleWare
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// MethodOverride middleware
app.use(methodOverride('_method'));

// Copied from npm js express session - Express Session Middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}))

//Passport middleware copied from PassportJS

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
//Global Variables
app.use(function(req,res,next){
  res.locals.success_msg= req.flash('success_msg');
  res.locals.error_msg= req.flash('error_msg');
  res.locals.error= req.flash('error');
  //Hide Login and Register if user is not new one
  res.locals.user = req.user || null;
      next();
});

//MiddleWare

app.use(function(req,res,next)
{
//  console.log(Date.now());
  req.name='ganesh';
  next();
});

// Index Route
app.get('/',(req,res)=>{
  const title = 'Welcome to AVM- Team!!';
  console.log(req.name);
  //res.send(req.name);
  res.render('index',{
    title : title
  });
//  res.send('INDEX');
});
// About Route
app.get('/about',(req,res)=>{
  //res.send('ABOUT1');
  res.render('ABOUT');
});

//Use routes
app.use('/ideas',ideas)
app.use('/users',users)

// error handlers
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  // handle CSRF token errors here if not CSURF forward to next middlewware
  res.status(403);
  res.send('It would seems your form failed to have the correct CSRF Token. We use these to protect your data.');
  // No routes handled the request and no system error, that means 404 issue.
  // Forward to next middleware to handle it.
  if (!err) return next();
  // set locals, only providing error in development
  res.locals.message = err.message;
  //res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.send('Something went wrong!!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('server started on port ${port}');
});
