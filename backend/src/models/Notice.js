import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title must be less than 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [1000, 'Message must be less than 1000 characters']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'update', 'alert'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdBy: {
    type: String,
    default: 'Admin'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
noticeSchema.index({ priority: 1, createdAt: -1 });
noticeSchema.index({ isActive: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
