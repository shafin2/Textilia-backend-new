const GeneralProposal = require("../../models/general/proposal.model");
const GeneralInquiry = require("../../models/general/inquiry.model");

exports.createGeneralProposals = async (req, res) => {
  const proposalsData = req.body.proposals; // Expect an array of proposal details
  if (!Array.isArray(proposalsData) || proposalsData.length === 0) {
    return res.status(400).json({ message: "No proposals provided" });
  }

  try {
    const createdProposals = [];
    for (const proposalData of proposalsData) {
      const {
        inquiryId,
        rate,
        quantity,
        deliveryStartDate,
        deliveryEndDate,
        paymentMode,
        shipmentTerms,
        businessCondition,
      } = proposalData;

      const inquiry = await GeneralInquiry.findById(inquiryId);
      if (!inquiry) {
        throw new Error(`Inquiry not found for ID ${inquiryId}`);
      }

      // Create the proposal
      const proposal = new GeneralProposal({
        inquiryId,
        supplierId: req.user.id,
        rate: proposalData.rate,
        quantity: proposalData.quantity,
        quantityType: proposalData.quantityType,
        deliveryStartDate: proposalData.deliveryStartDate,
        deliveryEndDate: proposalData.deliveryEndDate,
        paymentMode: proposalData.paymentMode,
        paymentDays: proposalData.paymentDays,
        shipmentTerms: proposalData.shipmentTerms,
        businessCondition: proposalData.businessCondition,
        status: "proposal_sent",
      });

      await proposal.save();
      createdProposals.push(proposal);

      // Update the inquiry status
      inquiry.status = "proposal_sent";
      await inquiry.save();
    }

    res.status(201).json({
      message: "Proposals created successfully",
      proposals: createdProposals,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating proposals", error: error.message });
  }
};

exports.getCustomerProposals = async (req, res) => {
  try {
    const proposals = await GeneralProposal.find({ customerId: req.user._id })
      .populate("supplierId", "name") // Populate supplier details
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching proposals", error: error.message });
  }
};

exports.getSupplierProposals = async (req, res) => {
  try {
    const proposals = await GeneralProposal.find({ supplierId: req.user.id })
      .populate({
        path: "inquiryId",
        select: "details customerId",
        populate: { path: "customerId", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.json({
      proposals: proposals.map(proposal => ({
        ...proposal.toObject(),
        customerName: proposal.inquiryId?.customerId?.name || "Unknown"
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching proposals", error: error.message });
  }
};


exports.acceptGeneralProposal = async (req, res) => {
  const { proposalId } = req.params;

  try {
    const proposal = await GeneralProposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    const inquiry = await GeneralInquiry.findById(proposal.inquiryId);
    // console.log(inquiry.customerId.toString(), req.user.id.toString())
    // if (inquiry.customerId.toString() !== req.user.id.toString()) {
    //     return res.status(403).json({ message: "Unauthorized action" });
    // }
    inquiry.status = "proposal_accepted";
    await inquiry.save();
    proposal.status = "proposal_accepted";
    await proposal.save();

    res
      .status(201)
      .json({ message: "Proposal accepted successfully", proposal });
  } catch (error) {
    console.error("Error accepting proposal:", error.message);
    res
      .status(500)
      .json({ message: "Error accepting proposal", error: error.message });
  }
};

exports.getInquiryProposals = async (req, res) => {
  try {
    const { inquiryId } = req.params;

    // Fetch the inquiry
    const inquiry = await GeneralInquiry.findById(inquiryId).select(
      "-customerId -__v"
    );
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    // Fetch all proposals for the given inquiry
    const proposals = await GeneralProposal.find({ inquiryId }).populate(
      "supplierId",
      "name email -_id"
    );

    if (!proposals || proposals.length === 0) {
      return res
        .status(404)
        .json({ message: "No proposals found for this inquiry." });
    }

    // Combine inquiry and all proposals
    const response = {
      inquiryDetails: inquiry,
      proposals: proposals,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching inquiry proposals:", error.message);
    res.status(500).json({ error: error.message });
  }
};
