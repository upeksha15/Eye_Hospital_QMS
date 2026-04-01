import express from "express";
import {
  createDoctorRoom,
  getAllDoctorRooms,
  getDoctorRoomById,
  updateDoctorRoom,
  deleteDoctorRoom,
  getSpecializations,
  enableDoctorRoom,
  disableDoctorRoom,
  pauseDoctorRoom,
  resumeDoctorRoom,
} from "../controllers/doctorRoomController.js";

const router = express.Router();

router.post("/", createDoctorRoom);
router.get("/", getAllDoctorRooms);
router.get("/specializations", getSpecializations);
router.get("/:id", getDoctorRoomById);
router.put("/:id", updateDoctorRoom);
router.delete("/:id", deleteDoctorRoom);

router.post("/:id/enable", enableDoctorRoom);
router.post("/:id/disable", disableDoctorRoom);
router.post("/:id/pause", pauseDoctorRoom);
router.post("/:id/resume", resumeDoctorRoom);

export default router;