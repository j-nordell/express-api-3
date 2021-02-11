
const express = require('express');
const createHttpError = require('http-errors');
const router = express.Router();
const Course = require('../models').Course;
const User = require('../models').User;
const { Op } = require("sequelize");
const bcrypt = require('bcryptjs');
const users = [];
const { authenticateUser } = require('../middleware/auth-user');

 /* Handler function to wrap each route. */
 function asyncHandler(cb){
  return async (req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      next(error);
    }
  }
}

/* Return the currently authenticated user */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  res.status(200).json({
    name: `${user.lastName}, ${user.firstName}`,
    emailAddress: user.emailAddress
  });
}));

/* Create a user */
router.post('/', asyncHandler(async (req, res) => {
  let user = req.body;
  const errors = [];

  // firstName must not be empty
  if(!user.firstName) {
    errors.push(`Please provide the user's firstName.`);
  }

  // lastName must not be empty
  if(!user.lastName) {
    errors.push(`Please provide the user's lastName.`);
  }
  
  // emailAddress must not be empty
  if(!user.emailAddress) {
    errors.push(`Please provide the emailAddress of the user.`);
  }

  // password must be between 8 and 20 characters and not empty
  let password = user.password;
  if(!password) {
    errors.push(`Please provide a value for password.`);
  } else if (password.length < 8 || password.length > 20) {
    errors.push(`Your password should be between 8 and 20 characters.`);
  } else {
    user.password = bcrypt.hashSync(password, 10);
  }


  try {
    if(user.emailAddress) {
      user = await User.create(req.body);
    }
  } catch(error) {
    errors.push(error.message);
  } 

  // Print errors if there are any
  if(errors.length > 0) {
    res.status(400).json({ errors });
  } else {
    users.push(user);
    res.set("Location", "/");
    res.status(201).end();
  }
}));

/* Gets a single user */
router.get('/:id', asyncHandler(async (req, res) => {
  let user;
  user = await User.findByPk(req.params.id);
  if(user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ msg: "That user was not found." });
  }
}));

module.exports = router;