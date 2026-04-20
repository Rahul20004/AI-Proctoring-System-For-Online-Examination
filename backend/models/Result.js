import mongoose from 'mongoose';

const cheatLogSchema = mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'mobile_phone', 'multiple_faces', 'no_face'
  timestamp: { type: Date, default: Date.now }
});

const resultSchema = mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Exam'
  },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeSpentPerQuestion: [{
    questionIndex: Number,
    timeSpent: Number // in seconds
  }],
  cheatLogs: [cheatLogSchema],
  reportSummary: { type: String },
  cheatingLogId: { type: String },
}, {
  timestamps: true
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
