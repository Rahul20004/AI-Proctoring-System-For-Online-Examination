import mongoose from 'mongoose';

const questionSchema = mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
});

const examSchema = mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // in minutes
  timerMode: { type: String, enum: ['global', 'per_question'], default: 'global' },
  durationPerQuestion: { type: Number }, // in seconds
  questions: [questionSchema],
}, {
  timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
