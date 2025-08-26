import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

function AdminDisputePage() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch disputes khi load trang
    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:9999/api/admin/disputes", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("API data:", res.data); // check cấu trúc dữ liệu
            setDisputes(res.data.disputes || res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách dispute");
        } finally {
            setLoading(false);
        }
    };



    const handleResolve = async (id, decision) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `http://localhost:9999/api/admin/disputes/${id}/resolve`,
                { decision },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success("Xử lý khiếu nại thành công");
            fetchDisputes();
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi xử lý dispute");
        }
    };


    if (loading) return <div className="p-4">Đang tải...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Quản lý Khiếu nại</h1>

            {disputes.length === 0 ? (
                <p>Không có khiếu nại nào cần xử lý.</p>
            ) : (
                <table className="w-full border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border px-4 py-2">ID</th>
                            <th className="border px-4 py-2">Người tạo</th>
                            <th className="border px-4 py-2">Mô tả</th>
                            <th className="border px-4 py-2">Trạng thái</th>
                            <th className="border px-4 py-2">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disputes.map((d) => (
                            <tr key={d._id}>
                                <td className="border px-4 py-2">{d._id}</td>
                                <td className="border px-4 py-2">
                                    {d.raisedBy?.email}
                                </td>

                                <td className="border px-4 py-2">{d.description}</td>
                                <td className="border px-4 py-2">{d.status}</td>
                                <td className="border px-4 py-2 space-x-2">
                                    <button
                                        onClick={() => handleResolve(d._id, "buyer")}
                                        className="bg-green-500 text-white px-3 py-1 rounded"
                                    >
                                        Buyer thắng
                                    </button>
                                    <button
                                        onClick={() => handleResolve(d._id, "seller")}
                                        className="bg-blue-500 text-white px-3 py-1 rounded"
                                    >
                                        Seller thắng
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminDisputePage;
