const cron = require("node-cron");
const Dispute = require("../models/Dispute");

function initDisputeChecker() {
     cron.schedule("*/10 * * * * *", async () => {
        console.log("🔎 Checking unresolved disputes...");
        const expired = await Dispute.find({
            resolution: null,
            status: "under_review",
            expireAt: { $lte: new Date() }
        });


        for (let d of expired) {
    d.status = "closed";

    if (d.messages.length > 0) {
        // Cập nhật message cuối cùng
        d.messages[d.messages.length - 1].message = "Do shop không phản hồi trong 48h, khiếu nại đã được chuyển cho admin xử lý.";
        d.messages[d.messages.length - 1].createdAt = new Date(); // nếu muốn update thời gian luôn
    } else {
        // Nếu chưa có message nào, tạo mới
        d.messages.push({
            sender: "system",
            message: "Do shop không phản hồi trong 48h, khiếu nại đã được chuyển cho admin xử lý.",
            createdAt: new Date()
        });
    }

    await d.save();
    console.log(`⚠️ Dispute ${d._id} closed.`);
}
    });
}

module.exports = { initDisputeChecker };
