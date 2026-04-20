import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    required: true,
    enum: ['Success', 'Failed']
  },
  capturedImage: {
    type: String, // Can store base64 string
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);
export default VerificationLog;
