const Review = require("../models/Review");
const Product = require("../models/Product");
const SellerReputation = require("../models/Feedback");
const mongoose = require("mongoose");
exports.getSellerReputation = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const reviews = await Review.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.sellerId": new mongoose.Types.ObjectId(sellerId) } },
    ]);

    if (!reviews.length) {
      return res.json({
        sellerId,
        reputationScore: 0,
        averageRating: 0,
        positiveRate: 0,
        totalReviews: 0,
      });
    }

    const totalReviews = reviews.length;

    // chỉ lấy review có rating hợp lệ (number)
    const validRatings = reviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r));

    const positiveCount = validRatings.filter((r) => r >= 4).length;
    const avgRating =
      validRatings.reduce((sum, rating) => sum + rating, 0) /
      (validRatings.length || 1); // tránh chia 0

    const positiveRate =
      validRatings.length > 0 ? positiveCount / validRatings.length : 0;

    // tính điểm uy tín
    let reputationScore = (positiveRate * 0.6 + (avgRating / 5) * 0.4) * 100;

    // fallback nếu NaN
    if (isNaN(reputationScore)) reputationScore = 0;

    const sellerReputation = await SellerReputation.findOneAndUpdate(
      { sellerId },
      {
        sellerId,
        reputationScore,
        averageRating: avgRating || 0,
        positiveRate,
        totalReviews,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: sellerReputation,
    });
  } catch (error) {
    console.error("Error checking review:", error);
    res.status(500).json({
      message: "Error checking review",
      error: error.message,
    });
  }
};
