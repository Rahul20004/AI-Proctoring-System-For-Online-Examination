import mongoose from 'mongoose';

const interviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    resumeText: {
      type: String,
      required: true,
    },
    interactions: [
      {
        question: String,
        answer: String,
        accuracy: Number,
        communication: Number,
        confidence: Number,
        feedback: String,
        correctAnswerSuggestion: String,
      },
    ],
    overallScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
