import fs from "fs/promises";

/*                        Delete Uploaded Temp Files                          */

const deleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore file delete errors
  }
};

/*                          Cleanup Uploaded Files                            */

const cleanupUploadedFiles = async (req, res, next) => {
  try {
    /*                              Single File                               */

    if (req.file?.path) {
      await deleteFile(req.file.path);
    }

    /*                             Multiple Files                             */

    if (req.files) {
      if (Array.isArray(req.files)) {
        await Promise.all(req.files.map((file) => deleteFile(file.path)));
      } else {
        await Promise.all(
          Object.values(req.files)
            .flat()
            .map((file) => deleteFile(file.path)),
        );
      }
    }
  } catch (error) {
    console.error("File Cleanup Error:", error.message);
  }

  next();
};

export default cleanupUploadedFiles;
