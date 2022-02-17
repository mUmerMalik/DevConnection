const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');
const request = require('request'); //Send the request to the server

//Model
const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@route  GET api/profile/me
//@desc   Get current user profile
//@access Private
router.get('/me', auth, async (req, res) => {
  try {
    //populate Get the filed from user model
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

    if (!profile) {
      res.status(400).json({ msg: 'There is no profile of this user' });
    } else {
      res.json(profile);
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

//@route  POST api/profile
//@desc   Create or Update user profile
//@access Private
router.post(
  '/',
  [auth, [check('status', 'Status is required').not().isEmpty(), check('skills', 'Skills is required').not().isEmpty()]],
  async (req, res) => {
    // Finds the validation errors in this request and wraps them in an single object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company, website, bio, location, status, githubusername, skills, youtube, twitter, facebook, instagram, linkedin } = req.body;

    //Build Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    //Build Social Objects
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //Update
        profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
      } else {
        //Create
        profile = new Profile(profileFields);
        await profile.save();
      }

      return res.json(profile);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route  Get api/profile
//@desc   Get all profile
//@access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.send('Server Error').status(400);
  }
});

//@route  Get api/profile/user/:user_id
//@desc   Get user profile by id
//@access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
    if (!profile) res.status(400).json({ msg: 'Profile not found' });
    else res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') res.status(400).json({ msg: 'Profile not found' });
    else res.send('Server Error').status(400);
  }
});

//@route  Delete api/profile
//@desc   Delete user,profile & post
//@access Private
router.delete('/', auth, async (req, res) => {
  try {
    //Remove Profile
    await Profile.findOneAndRemove();

    //Remove User
    await User.findOneAndRemove();

    res.json({ msg: 'User deleted successfully!' });
  } catch (err) {
    console.error(err.message);
    res.send('Server Error').status(400);
  }
});

//@route  PUT api/profile/experience
//@desc   Add user experience
//@access Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company, title, from, to, current, description, location } = req.body;
    const newExp = { company, title, from, to, current, description, location };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      //unshift same the push but it push the data on ate the end rather then the start
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(400).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/experience/:exp_id
//@desc   Delete user experience
//@access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get the index and remove that
    const removeIndex = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server Error');
  }
});

//@route  PUT api/profile/education
//@desc   Add user education
//@access Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, from, to, current, description, fieldofstudy } = req.body;
    const newEdu = { school, degree, from, to, current, description, fieldofstudy };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      //unshift same the push but it push the data on ate the end rather then the start
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(400).send('Server Error');
    }
  }
);

//@route  DELETE api/profile/education/:edu_id
//@desc   Delete user education
//@access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get the index and remove that
    const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server Error');
  }
});

//@route  GET api/profile/github/:username
//@desc   Get user repositories from github
//@access Public
router.get('/github/:username', auth, async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecretKey')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (err, response, body) => {
      if (err) console.error(err);

      if (response.statusCode !== 200) {
        return res.status(400).json({ msg: 'Github profile not found!' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(400).send('Server Error');
  }
});

module.exports = router;
