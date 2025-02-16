const express = require("express");
const {
	createGeneralInquiries,
	getCustomerInquiries,
	getSupplierInquiries,
	closeInquiry,
	getGeneralInquiryById,
} = require("../../controllers/general/inquiry.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect(["customer"]), createGeneralInquiries);
router.get("/:inquiryId", getGeneralInquiryById);
router.get("/customer/:customerId", getCustomerInquiries);
router.get("/supplier/:supplierId", getSupplierInquiries);
router.post("/close/:inquiryId", protect(["customer"]), closeInquiry);

module.exports = router;
