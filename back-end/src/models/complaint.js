const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complaintSchema = new Schema(
  {
    name: { type: String, required: true }, // tên người khiếu nại
    email: { type: String }, // email (không bắt buộc)
    message: { type: String, required: true }, // nội dung khiếu nại
    status: { type: String, default: "pending" }, // pending | resolved
  },
  { timestamps: true } // sẽ tự động tạo createdAt, updatedAt
);

module.exports = mongoose.model("Complaint", complaintSchema);
