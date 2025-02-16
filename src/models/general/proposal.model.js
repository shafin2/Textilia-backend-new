const mongoose = require("mongoose");

const generalProposalSchema = new mongoose.Schema({
    inquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GeneralInquiry",
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rate: { type: Number, required: true },
    quantity: { type: Number, required: true },
    quantityType: {
        type: String,
        enum: ["kg", "lbs", "bags"]
    },
    deliveryStartDate: { type: Date, required: true },
    deliveryEndDate: { type: Date, required: true },
    paymentMode: {
        type: String,
        enum: ["advance", "credit", "pdc", "advance_pdc", "lc"],
    },
    paymentDays: { type: Number },
    shipmentTerms: { type: String, },
    businessCondition: {
        type: String,
        enum: ["efs", "gst", "non_gst"],
    },
    status: {
        type: String,
        enum: [
            "proposal_sent",      // Supplier has responded with a proposal.
            "negotiation",        // Inquiry is under negotiation.
            "proposal_accepted",  // Customer has accepted the proposal.
            "contract_sent",      // Supplier has sent the contract.
            "contract_accepted",  // Contract has been accepted by the customer.
            "contract_running",   // Contract is currently in progress.
            "delivered",          // Items/services under the contract have been delivered.
            "inquiry_closed"      // Inquiry has been closed by either party.
        ],
        default: "proposal_sent"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("GeneralProposal", generalProposalSchema);
