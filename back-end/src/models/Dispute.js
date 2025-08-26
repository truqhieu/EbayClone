const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const disputeSchema = new Schema(
  {
    orderItemId: { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
    },
    
    resolution: { type: String },
      messages: [
      {
        sender: { type: String, enum: ["buyer", "seller", "system", "admin"], required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    expireAt: { type: Date, required: true }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
