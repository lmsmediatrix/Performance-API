import { cloudinary } from "../config/cloudinaryConfig";

const cloudinaryService = {
  uploadImage,
  deleteImage,
  uploadArrayOfImages,
  multipleUploadFile,
  uploadDocument,
  uploadPdf,
};

export default cloudinaryService;

async function uploadImage(
  file: Express.Multer.File,
  folder: string = "default-folder"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder,
        use_filename: true,
        unique_filename: true,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(`Error uploading image to Cloudinary: ${error.message}`));
        } else if (!result) {
          console.error("Cloudinary upload failed - no result returned");
          reject(new Error("Error uploading image to Cloudinary: No result returned"));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    try {
      uploadStream.end(file.buffer);
    } catch (error) {
      console.error("Error sending file buffer to Cloudinary:", error);
      reject(
        new Error(
          `Error sending file to Cloudinary: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });
}

async function uploadDocument(
  file: Express.Multer.File,
  folder: string = "default-folder"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileExtension = file.originalname.split(".").pop()?.toLowerCase() || "";
    const filenameWithoutExt = file.originalname.replace(/\.[^/.]+$/, "");
    const uploadOptions = {
      resource_type: "auto" as const,
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      public_id: filenameWithoutExt,
      format: fileExtension,
      type: "upload",
      chunk_size: 6000000,
    };

    if (file.size > 10 * 1024 * 1024) {
      console.log(`File size: ${file.size} bytes, using chunked upload`);

      cloudinary.uploader.upload_large(
        file.buffer.toString("base64"),
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Error uploading large document to Cloudinary:", error);
            reject(new Error(`Error uploading document to Cloudinary: ${error.message}`));
          } else if (!result) {
            reject(new Error("No result returned from Cloudinary upload"));
          } else {
            resolve(result.secure_url);
          }
        }
      );
    } else {
      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Error uploading document to Cloudinary:", error);
          reject(new Error(`Error uploading document to Cloudinary: ${error.message}`));
        } else if (!result) {
          reject(new Error("No result returned from Cloudinary upload"));
        } else {
          resolve(result.secure_url);
        }
      });

      uploadStream.end(file.buffer);
    }
  });
}

async function deleteImage(publicId: string): Promise<void> {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error("Error deleting image from Cloudinary");
  }
}

async function uploadArrayOfImages(
  files: Express.Multer.File[],
  folder: string = "default-folder"
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error("Error uploading multiple images to Cloudinary");
  }
}

async function uploadPdf(
  file: Express.Multer.File,
  folder: string = "default-folder"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: "raw" as const,
      folder,
      public_id: file.originalname.replace(/\.[^/.]+$/, "") + ".pdf",
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      type: "upload",
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Error uploading PDF to Cloudinary:", error);
          reject(new Error(`Error uploading PDF to Cloudinary: ${error.message}`));
        } else if (!result) {
          reject(new Error("No result returned from Cloudinary PDF upload"));
        } else {
          resolve(result.secure_url);
        }
      })
      .end(file.buffer);
  });
}

async function multipleUploadFile(
  files: Express.Multer.File[],
  folder: string = "default-folder"
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) => {
      const fileExtension = file.originalname.split(".").pop()?.toLowerCase() || "";
      if (fileExtension === "pdf" || file.mimetype === "application/pdf") {
        return uploadPdf(file, folder);
      }

      const isDocument =
        file.mimetype === "application/msword" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/vnd.ms-excel" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-powerpoint" ||
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.mimetype === "text/plain" ||
        ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(fileExtension);

      const isVideo =
        file.mimetype.startsWith("video/") ||
        ["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(fileExtension);
      if (isDocument) {
        return uploadDocument(file, folder);
      } else if (isVideo) {
        return new Promise<string>((resolve, reject) => {
          const uploadOptions = {
            resource_type: "video" as const,
            folder,
            public_id: file.originalname.replace(/\.[^/.]+$/, ""),
            use_filename: true,
            unique_filename: true,
            overwrite: true,
          };

          cloudinary.uploader
            .upload_stream(uploadOptions, (error, result) => {
              if (error) {
                console.error("Error uploading video to Cloudinary:", error);
                reject(new Error(`Error uploading video to Cloudinary: ${error.message}`));
              } else if (!result) {
                reject(new Error("No result returned from Cloudinary video upload"));
              } else {
                resolve(result.secure_url);
              }
            })
            .end(file.buffer);
        });
      } else {
        return uploadImage(file, folder);
      }
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Error in multipleUploadFile:", error);
    throw new Error(
      `Error uploading multiple files to Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
