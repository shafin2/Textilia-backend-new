const express = require("express");
const router = express.Router();
const blockBookingInquiryController = require("../controllers/blockBooking/inquiry.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/create", protect(["customer"]), blockBookingInquiryController.createInquiry);

// Route to get all inquiries for a customer
router.get("/customer/:customerId", blockBookingInquiryController.getCustomerInquiries);
router.get("/all",protect(["supplier"]), blockBookingInquiryController.getInquiries);
router.get("/:inquiryId", blockBookingInquiryController.getInquiry);
router.post("/decline/:inquiryId", protect(["customer"]), blockBookingInquiryController.declineInquiry);

module.exports = router;
