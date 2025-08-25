// src/pages/Complaints/Complaints.js
import { useState } from "react";
import axios from "axios";

export default function Complaints() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.message.trim()) {
      setError("Vui lòng nhập đầy đủ họ tên và nội dung khiếu nại!");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:9999/api/complaints",
        formData
      );

      if (res.status === 201) {
        setSuccess("Gửi khiếu nại thành công!");
        setFormData({ name: "", email: "", message: "" });
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Có lỗi xảy ra, vui lòng thử lại sau!"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="backdrop-blur-xl bg-white/30 p-8 rounded-3xl shadow-2xl w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Gửi Khiếu Nại
        </h2>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        <div className="mb-4">
          <label className="block mb-2 font-medium">Họ và Tên *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400"
            placeholder="Nhập họ và tên"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400"
            placeholder="Nhập email (không bắt buộc)"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-medium">Nội dung khiếu nại *</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400"
            placeholder="Nhập nội dung khiếu nại"
            rows="4"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-xl font-semibold shadow-md transition"
        >
          Gửi khiếu nại
        </button>
      </form>
    </div>
  );
}
