import express from "express";
import {
  createDoctorRoom,
  getAllDoctorRooms,
  getDoctorRoomById,
  updateDoctorRoom,
  deleteDoctorRoom,
} from "../controllers/doctorRoomController.js";

const router = express.Router();

router.post("/", createDoctorRoom);
router.get("/", getAllDoctorRooms);
router.get("/:id", getDoctorRoomById);
router.put("/:id", updateDoctorRoom);
router.delete("/:id", deleteDoctorRoom);

export default router;