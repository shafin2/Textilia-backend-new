const GeneralInquiry = require("../../models/general/inquiry.model");
const sanitize = require("mongo-sanitize"); // For data sanitization

exports.getGeneralInquiryById = async (req, res) => {
	try {
		const inquiryId = sanitize(req.params.inquiryId); // Sanitize the inquiryId
		const inquiry = await GeneralInquiry.findById(inquiryId)
			.populate(
				"customerId",
				"name profile.companyDetails.companyName profile.companyDetails.ntn profile.companyDetails.gst profile.companyDetails.address"
			) // Populate the customer details
			.lean(); // Use .lean() for better performance

		console.log("Inquiry: ", inquiry);

		if (!inquiry) {
			return res.status(404).json({ message: "Inquiry not found" });
		}

		res.status(200).json(inquiry);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching inquiry", error: error.message });
	}
};

// 1. Create General Inquiry
exports.createGeneralInquiries = async (req, res) => {
	try {
		const userId = req.user.id;

		const inquiriesData = req.body.inquiries;
		if (!Array.isArray(inquiriesData) || inquiriesData.length === 0) {
			return res.status(400).json({ message: "No inquiries provided" });
		}

		const inquiries = await Promise.all(
			inquiriesData.map(async (inquiryData) => {
				const {
					quantity,
					quantityType,
					rate,
					deliveryStartDate,
					deliveryEndDate,
					ppc,
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

				// Validate required fields
				if (
					!quantity ||
					!quantityType ||
					!rate ||
					!deliveryStartDate ||
					!deliveryEndDate
				) {
					throw new Error("Missing required fields in one or more inquiries");
				}

				const newInquiry = new GeneralInquiry({
					customerId: userId, // Automatically set the customer ID from authenticated user
					quantity,
					quantityType,
					rate,
					deliveryStartDate,
					deliveryEndDate,
					ppc, // Optional fields
					certification,
					paymentMode,
					paymentDays,
					shipmentTerms,
					businessCondition,
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
			message: "Error creating General Inquiries",
			error: error.message,
		});
	}
};

// 2. Get Inquiries for a Specific Customer
exports.getCustomerInquiries = async (req, res) => {
	try {
		const customerId = sanitize(req.params.customerId); // Sanitize the customerId
		// Fetch only the required fields
		const inquiries = await GeneralInquiry.find({ customerId })
			.select("ppc specifications quantity quantityType createdAt status")
			.sort({ createdAt: -1 }) // Sort in descending order
			.lean(); // Use .lean() for better performance
		res.status(200).json(inquiries);
	} catch (error) {
		res
			.status(500)
			.json({
				message: "Error fetching customer inquiries",
				error: error.message,
			});
	}
};

// 3. Get Inquiries for a Nominated Supplier
exports.getSupplierInquiries = async (req, res) => {
	try {
		const supplierId = sanitize(req.params.supplierId); // Sanitize the supplierId

		// Fetch inquiries and populate the customer (user) name
		const inquiries = await GeneralInquiry.find({ nomination: supplierId })
			.sort({ createdAt: -1 })
			.populate("customerId", "name email") // Populate user name field
			.lean(); // Use .lean() for better performance

		console.log("Inquiries: ", inquiries);
		res.status(200).json(inquiries);
	} catch (error) {
		res.status(500).json({
			message: "Error fetching supplier inquiries",
			error: error.message,
		});
	}
};


exports.closeInquiry = async (req, res) => {
	console.log("Closing inquiry");
	try {
		const inquiryId = sanitize(req.params.inquiryId);
		console.log("Inquiry ID: ", inquiryId);
		// Find the inquiry by ID and update the status
		const updatedInquiry = await GeneralInquiry.findByIdAndUpdate(
			inquiryId,
			{ status: "inquiry_closed" }, // Set the status to inquiry_close
			{ new: true } // Return the updated document
		);

		if (!updatedInquiry) {
			return res.status(404).json({ message: "Inquiry not found" }); // Handle case where inquiry ID is invalid
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
