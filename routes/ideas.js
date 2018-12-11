const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const csrf = require('csurf')
const router = express.Router();
const {ensureAuthenticated} = require('../helpers/auth');
const csrfProtection = csrf({ cookie: true });
const parseForm = bodyParser.urlencoded({ extended: false });

// Load Helper


//Load Model class
require('../models/Idea');
const Idea= mongoose.model('ideas');

// Idea Index Page
router.get('/',ensureAuthenticated,(req,res) =>
{
  Idea.find({user:req.user.id})
  .sort({date:'desc'})
  .then(ideas => {
  res.render('ideas/index', {
    ideas:ideas
    });
  });
});

//Add idea Form
router.get('/add', csrfProtection, ensureAuthenticated,(req,res)=>{
  res.render('ideas/add',{
    csrfToken: req.csrfToken(),
  });
});

// Edit Idea form
router.get('/edit/:id',csrfProtection, ensureAuthenticated, (req,res) => {
  Idea.findOne({
    _id: req.params.id
  })
  .then(idea => {
    if(idea.user != req.user.id){
      req.flash('error_msg','Not Authorized');
      res.redirect('/ideas');
    }
else {
  res.render('ideas/edit',{
    idea:idea,
    csrfToken: req.csrfToken(),
  });
}
});
});

//Process Form
router.post('/',ensureAuthenticated, (req,res)=>{
  //console.log(req.body)
let errors =[];
if(!req.body.title){
  errors.push({text:'Please add 1 a title'});
}
if(!req.body.details){
  errors.push({text:'Please add 2 some details'});
}

if(errors.length > 0)
{
  res.render('ideas/add',{
    errors: errors,
    title: req.body.title,
    details:req.body.details
  });
}
  else {
const newUser = {
title: req.body.title,
details: req.body.details,
user: req.user.id
}
new Idea(newUser)
.save()
.then(idea => {
req.flash('success_msg', 'Added Successfully');
  res.redirect('/ideas');
    })
  }
});

// Update Idea form
router.put('/:id', ensureAuthenticated, (req,res)=>{
Idea.findOne({
  _id: req.params.id
})
.then(idea => {
  //new Values edited
  idea.title = req.body.title;
  idea.details = req.body.details;
  idea.save()
  .then(idea => {
    req.flash('success_msg', 'Updated Successfully');
    res.redirect('/ideas');
  })
});
});

// Delete idea:
router.delete('/:id', ensureAuthenticated, (req,res)=>{
Idea.remove({_id: req.params.id})
.then(()=> {
req.flash('success_msg', 'Removed Successfully');
res.redirect('/ideas');
 });
});

module.exports = router;
