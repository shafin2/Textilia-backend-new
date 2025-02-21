const express = require("express");
const router = express.Router();
const blockBookingInquiryController = require("../../controllers/blockBooking/inquiry.controller");
const { protect } = require("../../middleware/auth.middleware");

router.get("/customer",protect(["customer"]), blockBookingInquiryController.getCustomerInquiries);
router.post("/create", protect(["customer"]), blockBookingInquiryController.createInquiry);
router.get("/all",protect(["supplier"]), blockBookingInquiryController.getInquiries);
router.get("/:inquiryId",protect(["supplier","customer"]), blockBookingInquiryController.getInquiry);
router.post("/decline/:inquiryId", protect(["customer"]), blockBookingInquiryController.declineInquiry);

module.exports = router;
