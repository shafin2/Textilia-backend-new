const { default: mongoose } = require("mongoose");
const Contract = require("../models/contract.model");
const GeneralProposal = require("../models/general/proposal.model");
const BlockBookingProposal = require("../models/blockBooking/proposal.model");

// Function to send (create) a new contract
const sendContract = async (req, res) => {
	try {
		const {
			contractNumber,
			contractDate,
			contractType,
			supplierId,
			customerId,
			description,
			// terms,
		} = req.body;

		if (contractType === "block-booking" && !req.body.allocationNumber) {
			return res.status(400).json({
				message: "Allocation number is required for block-booking contracts",
			});
		}

		const contract = new Contract({
			contractNumber,
			contractDate,
			contractType,
			supplierId,
			customerId,
			description,
			// terms,
			contractStatus: "contract_sent_rcvd",
			...(contractType === "block-booking" && {
				allocationNumber: req.body.allocationNumber,
			}),
		});

		const ProposalModel =
			contract.contractType === "general"
				? mongoose.model("GeneralProposal")
				: mongoose.model("BlockBookingProposal");

		const updatePromises = contract.description.map(async (proposalId) => {
			const proposal = await ProposalModel.findById(proposalId);
			if (proposal) {
				proposal.status = "contract_sent";
				return proposal.save();
			}
		});

		// Wait for all proposals to be updated
		await Promise.all(updatePromises);

		await contract.save();
		res
			.status(201)
			.json({ message: "Contract created successfully", contract });
	} catch (error) {
		res
			.status(400)
			.json({ message: "Failed to create contract", error: error.message });
	}
};

// Function to get a contract by its ID
const getContractById = async (req, res) => {
	try {
		const { id } = req.params;
		const contract = await Contract.findById(id)
			.populate("supplierId customerId description")
			.exec();

		if (!contract) {
			return res.status(404).json({ message: "Contract not found" });
		}
		res.status(200).json(contract);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error retrieving contract", error: error.message });
	}
};

const getAllUserContracts = async (req, res) => {
	try {
		const { userId } = req.params;

		// Query to find contracts for the user, excluding specific statuses
		const contracts = await Contract.find({
			contractStatus: { $ne: "contract_sent_rcvd" },
			$or: [{ supplierId: userId }, { customerId: userId }],
		})
			.populate("supplierId customerId", "name")
			.populate({
				path: "description",
				populate: {
					path: "inquiryId",
				},
			})
			.exec();

		const statuses = [
			"contract_sent",
			"contract_accepted",
			"contract_running",
			"delivered",
		];

		// Process and filter the contracts
		const updatedContracts = contracts.map((contract) => {
			const descriptions = Array.isArray(contract.description)
				? contract.description
				: [];

			const filteredDescriptions = descriptions
				.filter((desc) => statuses.includes(desc?.status))
				.map((desc) => ({
					...desc.toObject(),
					inquiryId: desc?.inquiryId,
				}));

			return {
				...contract.toObject(),
				description: filteredDescriptions,
			};
		});

		res.status(200).json(updatedContracts);
	} catch (error) {
		console.error("Error retrieving user contracts:", error);
		res.status(500).json({
			message: "Error retrieving user contracts",
			error: error.message,
		});
	}
};

const getAllRunningUserContracts = async (req, res) => {
	try {
		const { userId } = req.params;

		// Query to find contracts for the user, excluding specific statuses
		const contracts = await Contract.find({
			contractStatus: "running",
			$or: [{ supplierId: userId }, { customerId: userId }],
		})
			.populate("supplierId customerId", "name")
			.populate({
				path: "description",
				populate: {
					path: "inquiryId",
				},
			})
			.exec();

		const statuses = ["contract_running"];

		// Process and filter the contracts
		const updatedContracts = contracts.map((contract) => {
			const descriptions = Array.isArray(contract.description)
				? contract.description
				: [];

			const filteredDescriptions = descriptions
				.filter((desc) => statuses.includes(desc?.status))
				.map((desc) => ({
					...desc.toObject(),
					inquiryId: desc?.inquiryId,
				}));

			return {
				...contract.toObject(),
				description: filteredDescriptions,
			};
		});

		res.status(200).json(updatedContracts);
	} catch (error) {
		console.error("Error retrieving user contracts:", error);
		res.status(500).json({
			message: "Error retrieving user contracts",
			error: error.message,
		});
	}
};

// Function to get all new contracts (status: proposal_rcvd, reply_awaited, under_negotiation)
const getAllNewUserContracts = async (req, res) => {
	try {
		const { userId } = req.params;

		// Fetch contracts whose contratType is not equal to contract_send_rcvd and populate `supplierId`, `customerId`, and `description`
		const contracts = await Contract.find({
			contractStatus: {
				$in: ["contract_sent_rcvd"],
			},
			contractType: "general",
			$or: [{ supplierId: userId }, { customerId: userId }],
		})
			.populate("supplierId customerId", "name")
			.populate({
				path: "description",
				populate: "inquiryId",
			})
			.exec();

		// Modify the contracts to include `inquiryId` in the description objects
		const updatedContracts = contracts.map((contract) => {
			const updatedDescriptions = contract.description.map((desc) => ({
				...desc.toObject(), // Convert Mongoose sub-document to plain object
				inquiryId: desc.inquiryId, // Ensure `inquiryId` is explicitly included
			}));

			return {
				...contract.toObject(),
				description: updatedDescriptions,
			};
		});

		res.status(200).json(contracts);
	} catch (error) {
		console.error("Error retrieving user contracts:", error.message);
		res.status(500).json({
			message: "Error retrieving user contracts",
			error: error.message,
		});
	}
};

// Function to get all block booking contracts (status: proposal_rcvd, reply_awaited, under_negotiation)
const getAllBlockBookingUserContracts = async (req, res) => {
	try {
		const { userId } = req.params;

		// Query to find contracts for the user, excluding specific statuses
		const contracts = await Contract.find({
			contractStatus: { $in: ["contract_sent_rcvd"] },
			contractType: "block-booking",
			$or: [{ supplierId: userId }, { customerId: userId }],
		})
			.populate("supplierId customerId", "name")
			.populate({
				path: "description",
				populate: {
					path: "inquiryId",
				},
			})
			.exec();

		res.status(200).json(contracts);
	} catch (error) {
		console.error("Error retrieving user contracts:", error);
		res.status(500).json({
			message: "Error retrieving user contracts",
			error: error.message,
		});
	}
};

// Function to get all completed contracts (status: dlvrd, closed)
const getAllCompletedUserContracts = async (req, res) => {
	try {
		const { userId } = req.params;

		// Query to find contracts for the user, excluding specific statuses
		const contracts = await Contract.find({
			contractStatus: "dlvrd",
			$or: [{ supplierId: userId }, { customerId: userId }],
		})
			.populate("supplierId customerId", "name")
			.populate({
				path: "description",
				populate: {
					path: "inquiryId",
				},
			})
			.exec();

		const statuses = ["delivered"];

		// Process and filter the contracts
		const updatedContracts = contracts.map((contract) => {
			const descriptions = Array.isArray(contract.description)
				? contract.description
				: [];

			const filteredDescriptions = descriptions
				.filter((desc) => statuses.includes(desc?.status))
				.map((desc) => ({
					...desc.toObject(),
					inquiryId: desc?.inquiryId,
				}));

			return {
				...contract.toObject(),
				description: filteredDescriptions,
			};
		});

		res.status(200).json(updatedContracts);
	} catch (error) {
		console.error("Error retrieving user contracts:", error);
		res.status(500).json({
			message: "Error retrieving user contracts",
			error: error.message,
		});
	}
};

// Function to get all contracts (For debugging purposes)
const getAllContracts = async (req, res) => {
	try {
		const contracts = await Contract.find()
			.populate("supplierId customerId")
			.exec();
		res.status(200).json(contracts);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error retrieving contracts", error: error.message });
	}
};

// Function to accept a contract (e.g., change its status to "confirmed")
const acceptContract = async (req, res) => {
	try {
		const { id } = req.params;
		const { customerId, supplierId } = req.body;

		const contract = await Contract.findById(id).populate("description");

		if (!contract) {
			return res.status(404).json({ message: "Contract not found" });
		}

		if (
			customerId !== contract.customerId.toString() ||
			supplierId !== contract.supplierId.toString()
		) {
			return res.status(400).json({ message: "Invalid client or supplier" });
		}

		const ProposalModel =
			contract.contractType === "general"
				? mongoose.model("GeneralProposal")
				: mongoose.model("BlockBookingProposal");

		const updatePromises = contract.description.map(async (proposalId) => {
			const proposal = await ProposalModel.findById(proposalId);
			if (proposal) {
				proposal.status = "contract_running";
				return proposal.save();
			}
		});

		// Wait for all proposals to be updated
		await Promise.all(updatePromises);

		contract.contractStatus = "running";
		await contract.save();

		res
			.status(200)
			.json({ message: "Contract accepted successfully", contract });
	} catch (error) {
		console.error("Error accepting contract:", error.message);
		res.status(500).json({
			message: "Error accepting contract",
			error: error.message,
		});
	}
};

// Function to upload an SO Document
const uploadSODocument = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, path } = req.body;

		const contract = await Contract.findByIdAndUpdate(
			id,
			{ soDocument: { name, path } },
			{ new: true }
		);

		if (!contract) {
			return res.status(404).json({ message: "Contract not found" });
		}
		res
			.status(200)
			.json({ message: "SO Document uploaded successfully", contract });
	} catch (error) {
		res
			.status(400)
			.json({ message: "Error uploading SO Document", error: error.message });
	}
};

const createMonthlyPlans = async (req, res) => {
    const { contracts } = req.body;

    try {
        for (const contractData of contracts) {
            const { contractId, monthlyPlans } = contractData;

            const contract = await Contract.findById(contractId);
            if (!contract) {
                return res.status(404).json({ message: `Contract ${contractId} not found` });
            }

            contract.monthlyPlans.push(
                ...monthlyPlans.map((plan) => ({
                    date: plan.date,
                    quantity: plan.quantity,
                    status: "pending",
                }))
            );

            await contract.save();
			console.log(contract);
        }
        res.status(201).json({ message: "Monthly plans created successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMonthlyPlansForContract = async (req, res) => {
    const { contractId } = req.params;

    try {
        const contract = await Contract.findById(contractId).select("monthlyPlans");
        if (!contract) return res.status(404).json({ message: "Contract not found" });

        res.status(200).json(contract.monthlyPlans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
	sendContract,
	getContractById,
	getAllUserContracts,
	getAllContracts,
	acceptContract,
	uploadSODocument,
	getAllRunningUserContracts,
	getAllNewUserContracts,
	getAllBlockBookingUserContracts,
	getAllCompletedUserContracts,
	
	createMonthlyPlans,
	getMonthlyPlansForContract
};
