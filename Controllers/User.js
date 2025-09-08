const { UserModal } = require('../Models/UserModel');
const { generateHash, compareHash } = require('../Utils/BCrypt');
const { generateJwtToken } = require('../Utils/Jwt');

const register = async (req, res) => {
  const { email, password, terms } = req.body;

  try {
    let user = await UserModal.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await generateHash(password, 10);
    const newUser = new UserModal({
      email,
      password: hashedPassword,
      terms,
    });

    const savedUser = await newUser.save();
    const token = await generateJwtToken({ _id: savedUser._id });
    savedUser.password = undefined;

    res.status(201).json({
      message: 'User registered successfully.',
      user: savedUser,
      token,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages[0] });
    }

    res.status(500).json({ message: 'Internal server error.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req?.body || {};
    const user = await UserModal.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await compareHash(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = await generateJwtToken({ _id: user._id });
    user.password = undefined;
    return res.status(200).json({ token, user, message: 'Login successfully!' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.query.userId;

    const user = await UserModal.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
module.exports = { register, login, getMe };
