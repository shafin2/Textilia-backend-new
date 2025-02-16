const express = require("express");
const router = express.Router();
const blockBookingProposalController = require("../../controllers/blockBooking/proposal.controller");
const { protect } = require("../../middleware/auth.middleware");

router.post("/create", protect(["supplier"]), blockBookingProposalController.createProposal);

router.get("/customer", protect(["customer"]), blockBookingProposalController.getCustomerProposals);
router.get("/supplier", protect(["supplier"]), blockBookingProposalController.getSupplierProposals);

router.get("/proposal/:inquiryId", blockBookingProposalController.getProposalDetails);

router.get("/inquiryProposals/:inquiryId", blockBookingProposalController.getInquiryProposals);

router.post("/proposal/:proposalId/accept", protect(["customer"]), blockBookingProposalController.acceptProposal);



module.exports = router;
