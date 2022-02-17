const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //Taking token from header
  const token = req.header('x-auth-token');
  //If token is not
  if (!token) res.status(401).json({ msg: 'No token, authorization denied' });

  //Verify Token
  try {
    const decode = jwt.verify(token, config.get('jwtSecret'));
    req.user = decode.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
