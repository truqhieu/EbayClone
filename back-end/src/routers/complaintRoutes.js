const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");

// Gửi khiếu nại (người dùng không cần đăng nhập)
router.post("/", complaintController.createComplaint);

// Lấy danh sách khiếu nại (dành cho admin)
router.get("/", complaintController.getComplaints);

// Lấy chi tiết khiếu nại theo ID
router.get("/:id", complaintController.getComplaintById);

// Cập nhật trạng thái khiếu nại (admin xử lý)
router.put("/:id", complaintController.updateComplaintStatus);

// Xoá khiếu nại (admin)
router.delete("/:id", complaintController.deleteComplaint);

module.exports = router;
