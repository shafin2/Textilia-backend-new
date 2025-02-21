const express = require('express');
const router = express.Router();
const { createGeneralProposals, getCustomerProposals, getSupplierProposals, acceptGeneralProposal, getInquiryProposals } = require('../../controllers/general/proposal.controller');
const { protect } = require("../../middleware/auth.middleware");

router.get('/customer', protect(["customer"]), getCustomerProposals);
router.get('/supplier',protect(["supplier"]), getSupplierProposals);
router.post('/create',protect(["supplier"]) ,createGeneralProposals);
router.post('/:proposalId/accept', protect(["customer"]), acceptGeneralProposal);
router.get("/:inquiryId", protect(["customer", "supplier"]), getInquiryProposals);

module.exports = router;
