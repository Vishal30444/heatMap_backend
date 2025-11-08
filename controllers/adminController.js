const User = require('../models/User');

// Email sending has been disabled for this deployment. The functions and transporter
// that previously performed sending of emails were removed to avoid requiring
// email configuration and external services.

// Email subject helper
// Email subject helper removed (emailing disabled)

// @desc    Get all pending user requests
// @route   GET /api/admin/pending-users
// @access  Private/Admin
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users with their status
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/approve-user/:userId
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    user.status = 'approved';
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

  // Email sending disabled: previously would notify the user by email here.

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          approvedAt: user.approvedAt
        }
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reject user
// @route   PUT /api/admin/reject-user/:userId
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User is already ${user.status}`
      });
    }

    user.status = 'rejected';
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

  // Email sending disabled: previously would notify the user by email here.

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        rejectedUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

