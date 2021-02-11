const express = require('express');
const createHttpError = require('http-errors');
const router = express.Router();
const Course = require('../models').Course;
const User = require('../models').User;
const { Op } = require("sequelize");
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

/* Courses listing for all courses */
router.get('/', asyncHandler(async (req, res) => {
  const courses = await Course.findAll();
  let courseList = []
  for(let course of courses) {
    let teacher = await course.getTeacher();
    courseList.push({course: course, teacher: teacher});
  }
  await res.status(200).json(courseList);
}));

/* Create a course */
router.post('/', authenticateUser, asyncHandler( async (req, res) => {
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
  
  if(errors.length > 0) {
    res.status(400).json({ errors });
  } else {
    course = await Course.create(req.body);
    res.set("Location", `/${course.id}`);
    res.status(201).end();
  }
}));

/* Course listing for a single course */
router.get('/:id', asyncHandler(async (req, res) => {
  // course = await Course.findByPk(req.params.id, { include: [{all: true}]});
  let course = await Course.findByPk(req.params.id,);
  let teacher = await course.getTeacher();
  if(course) {
    // let teacher = await User.findByPk(course.userId);
    // console.log(teacher);
    res.status(200).json({course: course, teacher: teacher});
  } else {
    res.status(404).json({ msg: "That course was not found." });
  }
}));

router.put('/:id', authenticateUser, asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    const errors = [];
    if(course) {
      course.title = req.body.title;
      course.description = req.body.description;
      course.estimatedTime = req.body.estimatedTime;
      course.materialsNeeded = req.body.materialsNeeded;

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
      res.status(400).json({ msg: "Course not found!"});
    }
  }
));

router.delete('/:id', authenticateUser, asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id);

  try {
    course.destroy();
    res.status(204).end();
  } catch(error) {
    res.status(400).json(error);
  }
}));

module.exports = router;