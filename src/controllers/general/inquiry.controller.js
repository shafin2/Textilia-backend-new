const GeneralInquiry = require("../../models/general/inquiry.model");
const User = require("../../models/user.model");

const sanitize = require("mongo-sanitize");

exports.createGeneralInquiries = async (req, res) => {
	try {
		const userId = req.user.id;
		const inquiriesData = req.body.inquiries;

		if (!inquiriesData || (Array.isArray(inquiriesData) && inquiriesData.length === 0)) {
			return res.status(400).json({ message: "Inquiries data is missing or empty" });
		}

		const inquiries = await Promise.all(
			inquiriesData.map(async (inquiryData) => {
				const {
					quantity,
					quantityType,
					rate,
					deliveryStartDate,
					deliveryEndDate,
					po,
					certification,
					paymentMode,
					paymentDays,
					shipmentTerms,
					businessCondition,
					nomination,
					specifications,
					conewt,
					status,
				} = inquiryData;

				if (!quantity || !quantityType || !rate || !deliveryStartDate || !deliveryEndDate) {
					throw new Error("Missing required fields in one or more inquiries");
				}

				const newInquiry = new GeneralInquiry({
					customerId: userId,
					quantity,
					quantityType,
					rate,
					deliveryStartDate,
					deliveryEndDate,
					po,
					certification,
					paymentTerms: { paymentMode, paymentDays, shipmentTerms, businessCondition },
					nomination,
					specifications,
					conewt,
					status,
				});

				return newInquiry.save();
			})
		);

		res.status(201).json({
			message: `${inquiries.length} General Inquiries created successfully`,
			inquiries,
		});
	} catch (error) {
		res.status(500).json({
			message: error.message || "Error creating General Inquiries",
		});
	}
};

exports.closeInquiry = async (req, res) => {
	try {
		const inquiryId = sanitize(req.params.inquiryId);
		console.log("Inquiry ID: ", inquiryId);
		const updatedInquiry = await GeneralInquiry.findByIdAndUpdate(
			inquiryId,
			{ status: "inquiry_closed" },
			{ new: true }
		);

		if (!updatedInquiry) {
			return res.status(404).json({ message: "Inquiry not found" });
		}

		res.status(201).json({
			message: "Inquiry closed successfully",
			updatedInquiry,
		});
	} catch (error) {
		console.log(error.message);
		res.status(500).json({
			message: "Error updating inquiry status",
			error: error.message,
		});
	}
};

exports.getGeneralInquiryById = async (req, res) => {
	try {
		const inquiryId = sanitize(req.params.inquiryId);
		const userId = req.user.id;

		const inquiry = await GeneralInquiry.findById(inquiryId)
			.populate("customerId", "name");

		if (!inquiry) {
			return res.status(404).json({ message: "Inquiry not found" });
		}

		const response = {
			inquiryDetails: inquiry,
			customerName: inquiry.customerId ? inquiry.customerId.name : "N/A",
		};

		const user = await User.findById(userId);

		if (user.businessType === "customer" && inquiry.nomination) {
			await inquiry.populate("nomination", "name");
			response.suppliers = inquiry.nomination.map(supplier => supplier.name);
		}

		res.status(200).json(response);
	} catch (error) {
		res.status(500).json({
			message: error.message || "Error retrieving General Inquiry",
		});
	}
};

exports.test = async (req, res) => {
	res.status(200).json({ message: "Test route" });
}

exports.getCustomerInquiries = async (req, res) => {
	try {
		const userId = req.user.id;

		const inquiries = await GeneralInquiry.find({
			customerId: userId,
			status: { $ne: "inquiry_closed" }
		})
			.sort({ createdAt: -1 })
			.select("po specifications quantity quantityType createdAt status");

		res.status(200).json(inquiries);
	} catch (error) {
		res.status(500).json({
			message: error.message || "Error retrieving customer inquiries",
		});
	}
};

exports.getSupplierInquiries = async (req, res) => {
	try {
		const userId = req.user.id;

		const inquiries = await GeneralInquiry.find({
			nomination: userId,
			status: { $ne: "inquiry_closed" }
		})
			.sort({ createdAt: -1 })
			.populate("customerId", "name")
			.select("po specifications quantity quantityType createdAt status deliveryStartDate deliveryEndDate paymentTerms");

		res.status(200).json(inquiries);
	} catch (error) {
		res.status(500).json({
			message: error.message || "Error retrieving supplier inquiries",
		});
	}
};
