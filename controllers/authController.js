const User = require('../models/User');

exports.syncUser = async (req, res, next) => {
  try {
    const { uid, email } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ message: 'uid and email are required' });
    }

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({ firebaseUid: uid, email });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
