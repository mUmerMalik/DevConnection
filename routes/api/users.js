const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

//User modal
const User = require('../../models/User');

//@route  POST api/users
//@desc   Register Users
//@access Public(without jwtToken)
//Register User
router.post(
  '/',
  [
    check('name', 'Name is required!').not().isEmpty(),
    check('email', 'Please enter the valid email').isEmail(),
    check('password', 'Please enter the password with min 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      //If user exist
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exist' }] });
      }

      //Get user gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      //Bcrypt password
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      //Return JwtToken
      const payload = { user: { id: user.id } };

      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        else res.json({ token });
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
