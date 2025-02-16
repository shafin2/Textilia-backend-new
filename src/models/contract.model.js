const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
	{
		contractNumber: { type: String, required: true },
		contractDate: { type: Date, required: true },
		supplierId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		customerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		contractType: {
			type: String,
			required: true,
			enum: ["general", "block-booking"],
		},
		allocationNumber: {
			type: String,
			required: function () {
				return this.contractType === "block-booking";
			},
		},
		contractStatus: {
			type: String,
			enum: [
				"reply_awaited",
				"closed",
				"proposal_rcvd",
				"under_negotiation",
				"contract_awaited",
				"contract_sent_rcvd",
				"confirmed",
				"running",
				"dlvrd",
			],
			required: true,
		},
		description: [
			{
				type: mongoose.Schema.Types.ObjectId,
				required: true,
				validate: {
					validator: function (value) {
						if (this.contractType === "general") {
							return mongoose.model("GeneralProposal").exists({ _id: value });
						} else if (this.contractType === "block-booking") {
							return mongoose
								.model("BlockBookingProposal")
								.exists({ _id: value });
						}
						return false;
					},
					message: (props) =>
						`Invalid description reference for contractType "${props.instance.contractType}".`,
				},
				refPath: "contractTypeDescriptionRef",
			},
		],
		contractTypeDescriptionRef: {
			type: String,
			required: true,
			enum: ["GeneralProposal", "BlockBookingProposal"],
			default: function () {
				return this.contractType === "general"
					? "GeneralProposal"
					: "BlockBookingProposal";
			},
		},
		// terms: {
		// 	commission: { type: Number, required: true },
		// 	claimAdjustment: { type: String, required: true },
		// 	forceMajeure: { type: String, required: true },
		// 	note: { type: String },
		// },
		soDocument: { name: { type: String }, path: { type: String } },
		monthlyPlans: [
            {
                date: { type: Date, required: true },
                quantity: { type: Number, required: true },
                status: {
                    type: String,
                    enum: ["pending", "agreed", "rejected", "replied", "revised"],
                    default: "pending",
                },
                supplierTerms: {
                    date: { type: Date },
                    quantity: { type: Number },
                    remarks: { type: String },
                },
                finalAgreement: {
                    date: { type: Date },
                    quantity: { type: Number },
                },
            },
        ],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Contract", contractSchema);
