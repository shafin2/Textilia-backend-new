const BlockBookingInquiry = require("../../models/blockBooking/Inquiry.model");
const sanitize = require("mongo-sanitize"); // For data sanitization
const BlockBookingProposal = require("../../models/blockBooking/proposal.model");


// Create a new block booking inquiry
exports.createInquiry = async (req, res) => {
  try {
    const inquiryData = req.body;

    // Validate `countPrices`
    if (!Array.isArray(inquiryData.countPrices)) {
      return res.status(400).json({ message: "`countPrices` must be an array." });
    }

    if (inquiryData.upperCount < inquiryData.lowerCount) {
      return res.status(400).json({ message: "Upper count cannot be less than lower count." });
    }

    // Ensure countPrices cover all counts between lower and upper count
    const expectedCounts = [];
    for (let i = inquiryData.lowerCount; i <= inquiryData.upperCount; i++) {
      expectedCounts.push(i);
    }

    const providedCounts = inquiryData.countPrices.map(cp => cp.count);
    const missingCounts = expectedCounts.filter(c => !providedCounts.includes(c));
    if (missingCounts.length > 0) {
      return res.status(400).json({ message: `Missing prices for counts: ${missingCounts.join(", ")}` });
    }

    // Attach customerId from authenticated user
    inquiryData.customerId = req.user.id;

    const inquiry = new BlockBookingInquiry(inquiryData);
    const savedInquiry = await inquiry.save();
    res.status(201).json(savedInquiry);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get all inquiries for the logged-in customer
exports.getInquiries = async (req, res) => {
  try {
    // Fetch all inquiries with only the required fields
    const inquiries = await BlockBookingInquiry.find()
      .select("aging baseCount quantity quantityType deliveryStartDate deliveryEndDate status customerId")
      .populate("customerId", "name email")
      .lean();

    // Respond with all inquiries
    res.status(200).json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getCustomerInquiries = async (req, res) => {
  try {
    const customerId = sanitize(req.params.customerId); // Sanitize the customerId

    // Fetch inquiries
    const inquiries = await BlockBookingInquiry.find({ customerId: customerId })
      .select("baseCount quantity quantityType deliveryEndDate status aging")
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    // Get proposal counts for each inquiry
    const inquiryIds = inquiries.map((inquiry) => inquiry._id);

    const proposalCounts = await BlockBookingProposal.aggregate([
      { $match: { inquiryId: { $in: inquiryIds } } }, // Match proposals for given inquiries
      {
        $group: {
          _id: "$inquiryId",
          proposalCount: { $sum: 1 }, // Count the proposals
        },
      },
    ]);

    // Map the proposal counts back to their corresponding inquiries
    const proposalCountMap = proposalCounts.reduce((acc, cur) => {
      acc[cur._id.toString()] = cur.proposalCount;
      return acc;
    }, {});

    const inquiriesWithProposalCount = inquiries.map((inquiry) => ({
      ...inquiry,
      proposalCount: proposalCountMap[inquiry._id.toString()] || 0, // Add proposal count or default to 0
    }));

    // Respond with the inquiries and proposal counts
    res.status(200).json(inquiriesWithProposalCount);
  } catch (error) {
    console.error("Error fetching customer inquiries:", error.message);
    res.status(500).json({ error: error.message });
  }
};


exports.getInquiry = async (req, res) => {
  try {
    const inquiryId = sanitize(req.params.inquiryId); // Sanitize the inquiryId

    // Fetch the inquiry by ID
    const inquiry = await BlockBookingInquiry.findById(inquiryId)
      .lean(); // Convert Mongoose document to plain JavaScript object

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    console.log(inquiry)
    // Respond with the inquiry data
    res.status(200).json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.declineInquiry = async (req, res) => {
  try {
    const inquiryId = sanitize(req.params.inquiryId); // Sanitize the inquiryId

    // Find the inquiry by ID and update its status
    const inquiry = await BlockBookingInquiry.findByIdAndUpdate(
      inquiryId,
      { status: "inquiry_closed" },
      { new: true }
    ).lean();

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    // Update all proposals related to this inquiry
    await BlockBookingProposal.updateMany(
      { inquiryId: inquiryId },
      { status: "inquiry_closed" }
    );

    // Respond with the updated inquiry data
    res.status(200).json(inquiry);
  } catch (error) {
    console.error("Error declining inquiry:", error.message);
    res.status(500).json({ error: error.message });
  }
};