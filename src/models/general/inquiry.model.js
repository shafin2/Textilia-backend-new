const mongoose = require("mongoose");

const generalInquirySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", index: true,
      validate: {
        validator: async function (value) {
          const user = await mongoose.model("User").findById(value);
          return user && user.businessType === "customer";
        },
        message: (props) => `${props.value} is not a valid customer.`,
      },
    },
    ppc: { type: Number },
    quantity: { type: Number, required: true },
    quantityType: {
      type: String,
      enum: ["kg", "lbs", "bags"],
      required: true
    },
    rate: { type: Number },
    deliveryStartDate: { type: Date, required: true },
    deliveryEndDate: { type: Date, required: true },
    certification: {
      type: [String],
      enum: ["GOTS", "RWS", "Global Recycled Standard", "EU Ecolabel"],
    },
    paymentMode: {
      type: String,
      enum: ["advance", "credit", "pdc", "advance_pdc", "lc"],
    },
    paymentDays: { type: Number },
    shipmentTerms: { type: String },
    businessCondition: {
      type: String,
      enum: ["efs", "gst", "non_gst"],
    },
    nomination: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    specifications: { type: String },
    conewt: { type: Number },
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
  },
  {
    timestamps: true,
  }
);

// Indexes for faster searching
generalInquirySchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model("GeneralInquiry", generalInquirySchema);
