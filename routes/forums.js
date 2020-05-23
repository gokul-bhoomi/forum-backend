const express = require('express');
const Router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth.js');
const Forum = require('../models/Forum');
// @route    POST api/users
// @desc     Register a user
// @access   Private

Router.post('/', auth, async (req, res) => {
  const { topic, body, likes, commentstotal, comments } = req.body;

  try {
    const id = await User.findById(req.user.id);
    const newForum = new Forum({
      name: id.name,
      topic,
      body,
      likes,
      commentstotal,
      comments,
      user: req.user.id,
    });

    const forum = await newForum.save();

    return res.json(forum);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/forums
// @desc     Get all posts
// @access   public

Router.post('/post', async (req, res) => {
  try {
    const { text, post } = req.body;
    if (text) {
      const forums = await Forum.find({ $text: { $search: text } }).sort({
        date: -1,
      });
      return res.json(forums);
    } else {
      const forum = await Forum.findById(post);
      return res.json(forum);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});
Router.get('/myposts', auth, async (req, res) => {
  try {
    const forums = await Forum.find({ user: req.user.id }).sort({ date: -1 });
    return res.json(forums);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});
// @route     PUT api/contacts/:id
// @desc      Update contact
// @access    Private
Router.put('/:id', auth, async (req, res) => {
  // Build comments object

  try {
    let forum = await Forum.findById(req.params.id);

    if (!forum) return res.status(404).json({ msg: 'Forum not found' });
    if (req.body.flag === true)
      forum = await Forum.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: 1 } },
        { new: true }
      );
    else
      forum = await Forum.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: -1 } },
        { new: true }
      );
    res.json(forum);
  } catch (err) {
    console.error(er.message);
    res.status(500).send('Server Error');
  }
});
Router.put('/post/:id', auth, async (req, res) => {
  // Build comments o  bject

  try {
    let forum = await Forum.findById(req.params.id);

    if (!forum) return res.status(404).json({ msg: 'Forum not found' });

    forum = await Forum.findByIdAndUpdate(req.params.id, {
      body: req.body.text,
    });

    res.json(forum);
  } catch (err) {
    console.error(er.message);
    res.status(500).send('Server Error');
  }
});

Router.put('/comments/:id', auth, async (req, res) => {
  const { body, date } = req.body;
  const id = await User.findById(req.user.id);

  // Build comments object

  const newcomment = { text: body, name: id.name, date };

  try {
    let forum = await Forum.findById(req.params.id);

    if (!forum) return res.status(404).json({ msg: 'Forum not found' });

    forum = await Forum.findByIdAndUpdate(
      req.params.id,
      {
        $push: { comments: { $each: [newcomment], $position: 0 } },
        $inc: { commentstotal: 1 },
      },
      { new: true }
    );

    res.json(forum);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/contacts/:id
// @desc      Delete contact
// @access    Private
Router.delete('/:id', auth, async (req, res) => {
  try {
    let post = await Forum.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: 'post not found' });

    // Make sure user owns contact
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Forum.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = Router;
