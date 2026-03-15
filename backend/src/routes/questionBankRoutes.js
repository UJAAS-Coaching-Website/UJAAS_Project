import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.js";
import {
    handleDeleteQuestionBankBatchLink,
    handleGetQuestionBank,
    handleUploadQuestionBankFile,
} from "../controllers/questionBankController.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 1,
    },
});

router.use(authenticate);

router.get("/", handleGetQuestionBank);
router.post("/upload", upload.single("file"), handleUploadQuestionBankFile);
router.delete("/:fileId/batches/:batchId", handleDeleteQuestionBankBatchLink);

export default router;
