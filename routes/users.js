const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const bodyParser = require('body-parser');
const csrf = require('csurf')
const router = express.Router();
const csrfProtection = csrf({ cookie: true });
const parseForm = bodyParser.urlencoded({ extended: false });

// Load User model
require('../models/User');
const User = mongoose.model('users');


// User Login Route
router.get('/login',csrfProtection, (req,res)=>{
  res.render('users/login',{
      csrfToken: req.csrfToken(),
  });
})

// User Register Route
router.get('/register',csrfProtection, (req,res)=>{
  res.render('users/register',{
          csrfToken: req.csrfToken(),
  });
})

// Login from post
router.post('/login', (req,res,next) =>{
  passport.authenticate('local',{
    successRedirect :'/ideas',
    failureRedirect : '/users/login',
    failureFlash : true,
  })(req,res,next);
});

// Register Form post
router.post('/register',(req,res)=>{
//  console.log(req.body);
//  res.send('ganesh');
let errors =[];
if(req.body.password != req.body.password2){
  errors.push({text: 'Passwords do not match'});
}
if(req.body.password < 4){
  errors.push({text: 'Password must be atleast 4 characters'});
}

if(errors.length >0)
{
  res.render('users/register',{
    errors: errors,
    name:req.body.name,
    email:req.body.email,
    password:req.body.password,
    password2: req.body.password
  });
}
else {
  User.findOne({email: req.body.email})
  .then(user => {
    if(user)
    {
      req.flash('error_msg','Email already registered.');
      res.redirect('/users/login');
    }
    else {
      const newUser = new User({
        name : req.body.name,
        email : req.body.email,
        password : req.body.password
      });
      bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(newUser.password, salt, (err, hash) =>{
          console.log(newUser.password);
          console.log(hash);
          if(err) throw err;
          newUser.password = hash;
          newUser.save()
          .then(usr =>{
            req.flash('success_msg','Successfully Registered!!')
            res.redirect('/users/login');
              })
              .catch(err =>{
                console.log(err);
                return;
              });
        });
      });
    }
  });
}
});

// Logout User
router.get('/logout',(req,res)=>{
  req.logout();
  req.flash('success_msg','You are logged out');
  res.redirect('/users/login');
});
module.exports = router;
