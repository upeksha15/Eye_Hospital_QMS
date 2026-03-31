import Notice from '../models/Notice.js';

// Get all notices
export const getAllNotices = async (req, res) => {
  try {
    const { isActive, priority, type } = req.query;
    
    // Build filter query
    let filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const notices = await Notice.find(filter)
      .sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching notices',
      message: error.message
    });
  }
};

// Get single notice by ID
export const getNoticeById = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching notice',
      message: error.message
    });
  }
};

// Create new notice
export const createNotice = async (req, res) => {
  try {
    const { title, message, type, priority, createdBy } = req.body;

    const notice = await Notice.create({
      title,
      message,
      type,
      priority,
      createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: notice
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error creating notice',
      message: error.message
    });
  }
};

// Update notice
export const updateNotice = async (req, res) => {
  try {
    const { title, message, type, priority, isActive } = req.body;

    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, message, type, priority, isActive },
      { new: true, runValidators: true }
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error updating notice',
      message: error.message
    });
  }
};

// Delete notice
export const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting notice',
      message: error.message
    });
  }
};

// Soft delete (mark as inactive)
export const deactivateNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notice deactivated successfully',
      data: notice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deactivating notice',
      message: error.message
    });
  }
};

export default {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  deactivateNotice
};
