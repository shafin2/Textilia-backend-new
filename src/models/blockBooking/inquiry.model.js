const mongoose = require("mongoose");

const blockBookingInquirySchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  baseSpecs: {
    carded: { type: Boolean, default: false },
    combed: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
    plain: { type: Boolean, default: false },
    slub: { type: Boolean, default: false },
    lycra: { type: Boolean, default: false }
  },
  baseCount: { type: Number, min: 6, max: 120, required: true },
  slubUpcharge: { type: Number, required: true },
  targetBasePrice: { type: Number, required: true },
  upperCount: { type: Number, min: 6, max: 120, required: true },
  lowerCount: { type: Number, min: 6, max: 120, required: true },
  countPrices: [{
    count: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  quantity: { type: Number, required: true },
  quantityType: {
    type: String,
    enum: ["kg", "lbs", "bags"],
    required: true
  },
  deliveryStartDate: { type: Date, required: true },
  deliveryEndDate: { type: Date,required: true },
  paymentTerms: {
    paymentMode: { type: String, enum: ["advance", "credit", "pdc", "advance_pdc", "lc"], required: true },
    days: { type: Number, required: true },
    shipmentTerms: { type: String, required: true },
    businessConditions: {
      type: String,
      enum: ["efs", "gst", "non_gst"],
      required: true
    }
  },
  materialCharges: [{
    material: { type: String, required: true },
    upcharge: { type: Number, required: true }
  }],
  certificateUpcharges: [{
    certificate: { type: String, required: true },
    upcharge: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }, // Ensure this field is updated when status changes
  aging: { type: Number, default: 0 },
  status: {
    type: String,
    enum: [
      "inquiry_sent",       // Inquiry has been sent by the customer.
      "proposal_sent",      // Supplier has responded with a proposal.
      "negotiation",        // Inquiry is under negotiation.
      "proposal_accepted",  // Customer has accepted the proposal.
      "contract_sent",      // Supplier has sent the contract.
      "contract_accepted",  // Contract has been accepted by the customer.
      "contract_running",   // Contract is currently in progress.
      "delivered",          // Items/services under the contract have been delivered.
      "inquiry_closed"      // Inquiry has been closed by either party.
    ],
    default: "inquiry_sent",
  }
});

blockBookingInquirySchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.updatedAt = new Date();
    if (this.status === "inquiry_replied") {
      const createdAt = this.createdAt || new Date();
      const updatedAt = this.updatedAt || new Date();
      const diffInTime = updatedAt.getTime() - createdAt.getTime();
      this.aging = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
    }
  }
  next();
});

module.exports = mongoose.model("BlockBookingInquiry", blockBookingInquirySchema);
