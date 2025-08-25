import React, { useEffect, useState } from "react";
import { Table, Button, Modal } from "react-bootstrap";
import axios from "axios";

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:9999/api/complaints");
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  // View complaint
  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setShowModal(true);
  };

  // Toggle read/unread
  const handleToggleRead = async (id, isRead) => {
    try {
      await axios.put(`http://localhost:9999/api/complaints/${id}`, {
        status: isRead ? "unread" : "read",
      });
      fetchComplaints();
    } catch (err) {
      console.error("Error updating complaint:", err);
    }
  };

  // Delete complaint
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá khiếu nại này?")) return;
    try {
      await axios.delete(`http://localhost:9999/api/complaints/${id}`);
      fetchComplaints();
    } catch (err) {
      console.error("Error deleting complaint:", err);
    }
  };

  return (
    <div className="container mt-4">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Khách hàng</th>
            <th>Nội dung</th>
            <th>Ngày gửi</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.message.slice(0, 40)}...</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleView(c)}
                  className="me-2"
                >
                  Xem
                </Button>
                <Button
                  variant={c.status === "read" ? "secondary" : "success"}
                  size="sm"
                  onClick={() => handleToggleRead(c._id, c.status === "read")}
                  className="me-2"
                >
                  {c.status === "read"
                    ? "Đánh dấu chưa đọc"
                    : "Đánh dấu đã đọc"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(c._id)}
                >
                  Xoá
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal xem chi tiết */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết khiếu nại</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComplaint && (
            <>
              <p>
                <strong>Khách hàng:</strong> {selectedComplaint.customerName}
              </p>
              <p>
                <strong>Email:</strong> {selectedComplaint.customerEmail}
              </p>
              <p>
                <strong>Nội dung:</strong> {selectedComplaint.message}
              </p>
              <p>
                <strong>Ngày gửi:</strong>{" "}
                {new Date(selectedComplaint.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {selectedComplaint.status === "read" ? "Đã đọc" : "Chưa đọc"}
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ComplaintList;
