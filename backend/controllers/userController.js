import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      profileImage: user.profileImage
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, faceImage } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    profileImage: req.body.profileImage || req.body.faceImage
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Verify Candidate Face
// @route   POST /api/users/verify-face
// @access  Private
const verifyFace = asyncHandler(async (req, res) => {
  const { capturedImage } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.profileImage) {
     res.status(400);
     throw new Error('No registered face image found for verification.');
  }

  // The actual face matching was done on the frontend using face-api.
  // We simply store the log of the successful verification.
  
  // Dynamically import the model to avoid circular dependency if any
  const VerificationLog = (await import('../models/VerificationLog.js')).default;
  
  await VerificationLog.create({
    user: req.user._id,
    status: 'Success',
    capturedImage
  });

  res.json({ verified: true, message: 'Face verified successfully and log stored' });
});

const saveFace = asyncHandler(async (req, res) => {
  const { image } = req.body;
  const user = await User.findById(req.user._id);
  
  if (user) {
    user.profileImage = image;
    await user.save();
    res.json({ message: 'Profile image saved' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { authUser, registerUser, verifyFace, saveFace, getUserProfile };
