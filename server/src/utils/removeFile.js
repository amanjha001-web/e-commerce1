import fs from "fs/promises";

/*                           Remove Local File                                */

const removeFile = async (filePath) => {
  try {
    if (!filePath) return;

    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
  }
};

/*                             Remove Multiple Files                          */

const removeFiles = async (filePaths = []) => {
  await Promise.all(filePaths.map((filePath) => removeFile(filePath)));
};

/*                                  Export                                    */

export { removeFile, removeFiles };
