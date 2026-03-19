import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: Function) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "text/csv" ||
    file.mimetype === "application/csv" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Unsupported file type! Please upload only images, videos, PDFs, or CSV files."),
      false
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
