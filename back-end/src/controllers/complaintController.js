const Complaint = require("../models/complaint");

// @desc    Gửi khiếu nại
// @route   POST /complaints
// @access  Public
exports.createComplaint = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const complaint = new Complaint({
      name,
      email,
      message,
    });

    await complaint.save();

    res
      .status(201)
      .json({ message: "Complaint submitted successfully", complaint });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Lấy tất cả khiếu nại
// @route   GET /complaints
// @access  Admin (có thể public tạm thời)
exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Lấy khiếu nại theo ID
// @route   GET /complaints/:id
// @access  Admin
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.status(200).json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Cập nhật trạng thái khiếu nại (đã xử lý/chưa xử lý)
// @route   PUT /complaints/:id
// @access  Admin
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.status(200).json({ message: "Complaint status updated", complaint });
  } catch (error) {
    console.error("Error updating complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Xóa khiếu nại
// @route   DELETE /complaints/:id
// @access  Admin
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.status(200).json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Error deleting complaint:", error);
    res.status(500).json({ error: "Server error" });
  }
};
