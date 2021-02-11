const express = require('express');
const createHttpError = require('http-errors');
const router = express.Router();
const Course = require('../models').Course;
const User = require('../models').User;
const { Op } = require("sequelize");
const { authenticateUser } = require('../middleware/auth-user');

// Handler function to wrap each route. 
function asyncHandler(cb){
  return async (req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      next(error);
    }
  }
}

// Courses listing for all courses including the teacher
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({ attributes: { exclude: ['createdAt', 'updatedAt']} });
  let courseList = []
  for(let course of courses) {
    let teacher = await course.getTeacher({ attributes: { exclude: ['createdAt', 'updatedAt', 'password']} });
    courseList.push({course: course, user: teacher});
  }
  await res.status(200).json(courseList);
}));

// Create a course if authenticated
router.post('/', authenticateUser(true), asyncHandler( async (req, res) => {
  let course = req.body;
  const errors = [];
  
  // Check for an empty title
  if(!course.title) {
    errors.push("Please enter a title for the course.");
  }

  // Check for an empty description
  if(!course.description) {
    errors.push("Please enter a description for the course.");
  }
  
  // Display errors if available
  if(errors.length > 0) {
    res.status(400).json({ errors });
  } else {
    course = await Course.create(req.body);
    res.set("Location", `/${course.id}`);
    res.status(201).end();
  }
}));

/* Course listing for a single course including the teacher*/
router.get('/:id', asyncHandler(async (req, res) => {
  let course = await Course.findByPk(req.params.id, {attributes: { exclude: ['createdAt', 'updatedAt']}});
  if(course) {
    let teacher = await course.getTeacher({ attributes: { exclude: ['createdAt', 'updatedAt', 'password']} });
    res.status(200).json({course: course, user: teacher});
  } else {
    res.status(404).json({ msg: "That course was not found." });
  }
}));

// Update a course if authenticated and owner
router.put('/:id', authenticateUser(true), asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    const user = req.currentUser;
    const errors = [];
    if(course) {
      course.title = req.body.title;
      course.description = req.body.description;
      course.estimatedTime = req.body.estimatedTime;
      course.materialsNeeded = req.body.materialsNeeded;
      if(user.id == course.userId) {
        try {
          await course.save();
          res.status(204).end();
        } catch(error) {
          for(let err of error.errors) {
            errors.push(err.message);
          }
          res.status(400).json({ errors });
        }
      } else {
        res.status(403).json({ msg: "You do not own this course!" });
      }
    } else {
      res.status(400).json({ msg: "Course not found!"});
    }
  }
));

// Delete a course if authenticated and owner
router.delete('/:id', authenticateUser(true), asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  const user = req.currentUser;
  if(user.id == course.userId) {
    try {
      course.destroy();
      res.status(204).end();
    } catch(error) {
      res.status(400).json(error);
    }
  } else {
  res.status(403).json({ msg: "You can't delete a course you don't own!"})
}
}));

module.exports = router;