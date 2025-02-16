const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
	sendContract,
	getContractById,
	getAllUserContracts,
	getAllNewUserContracts,
	acceptContract,
	getAllRunningUserContracts,
	getAllCompletedUserContracts,
	getAllBlockBookingUserContracts,
	createMonthlyPlans,
	getMonthlyPlansForContract
} = require("../controllers/contract.controller");

router.get("/:id", protect(["supplier", "customer"]), getContractById);
router.get(
	"/all/:userId",
	protect(["supplier", "customer"]),
	getAllUserContracts
);
router.get(
	"/running/:userId",
	protect(["supplier", "customer"]),
	getAllRunningUserContracts
);
router.get(
	"/completed/:userId",
	protect(["supplier", "customer"]),
	getAllCompletedUserContracts
);
router.get(
	"/blockbooking/:userId",
	protect(["supplier", "customer"]),
	getAllBlockBookingUserContracts
);
router.get(
	"/new/:userId",
	protect(["supplier", "customer"]),
	getAllNewUserContracts
);
router.post("/create", protect(["supplier"]), sendContract);
router.post("/accept/:id", protect(["customer"]), acceptContract);


router.post("/customer/monthly-plans", protect(["customer"]), createMonthlyPlans);
router.get("/customer/:contractId/monthly-plans", protect(["customer"]), getMonthlyPlansForContract);


module.exports = router;
