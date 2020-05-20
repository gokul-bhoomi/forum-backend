const express = require('express');
const Router = express.Router();
const bcrypt = require('bcryptjs');
const config = require('config');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth.js');

// @route    POST api/users
// @desc     Register a user
// @access   Public

Router.post(
  '/',
  [
    check('name', 'Please add name').not().isEmpty(),
    check('email', 'Please include valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],

  async (req, res) => {
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: 'User already exits' });

      user = new User({
        name,
        email,
        password,
      });
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

Router.put('/', auth, async (req, res) => {
  const { like, dislike } = req.body;

  // Build comments object
  try {
    let user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (like) {
      console.log(typeof like);
      user = await User.findByIdAndUpdate(
        req.user.id,
        { $push: { liked: like } },
        { new: true }
      );
    } else {
      console.log('like');
      user = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { liked: dislike } },
        { new: true }
      );
    }

    res.json(user);
  } catch (err) {
    console.error(er.message);
    res.status(500).send('Server Error');
  }
});

module.exports = Router;
