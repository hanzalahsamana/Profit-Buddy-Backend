const { UserModal } = require('../Models/UserModel');
const { sendEmail } = require('../Services/Nodemailer.service');
const { ForgotPasswordTemplate } = require('../Templates/ForgotPasswordTemplate');
const { generateHash, compareHash } = require('../Utils/BCrypt');
const { generateJwtToken } = require('../Utils/Jwt');
const crypto = require('crypto');

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
    const token = await generateJwtToken({ _id: savedUser._id, tokenVersion: savedUser.tokenVersion });
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

// const sendMagicLink = async (req, res) => {
//   try {
//     const { userId, purpose, newEmail } = req.body;

//     if (!userId || !purpose) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const user = await UserModal.findById(userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const token = crypto.randomBytes(32).toString('hex');
//     const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

//     user.magicToken = token;
//     user.magicTokenPurpose = purpose;
//     user.magicTokenExpiry = expiry;
//     if (purpose === 'change_email' && newEmail) {
//       user.tempEmail = newEmail; // optional field to store pending email
//     }
//     await user.save();

//     const magicLink = `${process.env.LIVE_DOMAIN}/verify?token=${token}&purpose=${purpose}`;

//     await sendEmail(
//       user.email,
//       'Verify Your Action',
//       `
//       <p>Click below to verify:</p>
//       <a href="${magicLink}" style="background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
//         Verify Action
//       </a>
//     `
//     );

//     return res.status(200).json({ success: true, message: 'Magic link sent' });
//   } catch (err) {
//     console.error('sendMagicLink Error:', err);
//     return res.status(500).json({ success: false, message: 'Failed to send magic link' });
//   }
// };

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

    const token = await generateJwtToken({ _id: user._id, tokenVersion: user.tokenVersion });
    user.password = undefined;
    return res.status(200).json({ token, user, message: 'Login successfully!' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserDetail = async (req, res) => {
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

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address to receive a password reset link.',
      });
    }

    const user = await UserModal.findOne({ email }).select('+resetToken +resetTokenExpiry');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check for typos or sign up for a new account.',
      });
    }

    if (user.resetToken && user.resetTokenExpiry && user.resetTokenExpiry > Date.now()) {
      const timeLeft = Math.ceil((user.resetTokenExpiry - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `A password reset link was already sent. Please check your inbox or try again in ${timeLeft} minute(s).`,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.LIVE_DOMAIN}/reset-password?email=${encodeURIComponent(user.email)}&token=${resetToken}`;

    await sendEmail(user.email, 'Reset Your Profit Buddy Password', ForgotPasswordTemplate(resetLink));

    return res.status(200).json({
      success: true,
      message: "We've sent you a password reset link! Please check your email (and spam folder).",
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while processing your request. Please try again later.',
      error: error.message,
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { email, token } = req.body || {};

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        message: !email ? 'Email is required to verify the reset link.' : 'Reset token is missing. Please use the latest link sent to your email.',
      });
    }

    const user = await UserModal.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      const emailExists = await UserModal.findOne({ email });
      if (!emailExists) {
        return res.status(404).json({
          success: false,
          message: "We couldn't find an account with this email. Please make sure you entered the correct one.",
        });
      }

      const userWithExpiredToken = await UserModal.findOne({
        email,
        resetToken: token,
      }).select('+resetToken +resetTokenExpiry');

      if (userWithExpiredToken) {
        return res.status(400).json({
          success: false,
          message: 'Your reset link has expired. Please request a new password reset link.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid reset link. Please request a new password reset email and try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your password reset link is valid. You can now reset your password.',
    });
  } catch (error) {
    console.error('Error in verifyResetToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while verifying your reset link. Please try again later.',
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: !email
          ? 'Email is required to reset your password.'
          : !token
          ? 'Reset token is missing. Please use the latest link sent to your email.'
          : 'New password is required to reset your account password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const user = await UserModal.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    }).select('+password +resetToken +resetTokenExpiry');

    if (!user) {
      const emailExists = await UserModal.findOne({ email });
      if (!emailExists) {
        return res.status(404).json({
          success: false,
          message: "We couldn't find an account with this email. Please check the email or sign up for a new account.",
        });
      }

      const tokenExists = await UserModal.findOne({ email, resetToken: token }).select('+resetToken +resetTokenExpiry');
      if (tokenExists) {
        return res.status(400).json({
          success: false,
          message: 'Your reset link has expired. Please request a new one.',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Invalid reset token. Please use the latest password reset email you received.',
      });
    }

    const hashedPassword = await generateHash(newPassword);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.tokenVersion += 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while resetting your password. Please try again later.',
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  console.log('wdicbsihd');

  try {
    const { userId } = req.query;
    const { userName } = req.body || {};

    let user = await UserModal.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (userName) user.userName = userName;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while updating your profile.',
      error: error,
    });
  }
};

module.exports = { register, login, getUserDetail, requestPasswordReset, verifyResetToken, resetPassword, updateProfile };
