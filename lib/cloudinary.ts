/**
 * DEPRECATED: Cloudinary has been completely removed in favor of First-Party Image Hosting (PRD FR-13).
 * This file is retained as a stub for backward compatibility with older offline scripts.
 */

export async function uploadToCloudinary(
  _fileData: string | Buffer,
  _folder: string = "intrihub",
  _publicId?: string
): Promise<{ secure_url: string }> {
  console.warn("[Cloudinary Deprecated] IntriHub now uses 100% first-party image storage.");
  return {
    secure_url: "/images/brand/placeholder.svg",
  };
}

export const cloudinary = {
  config: () => {},
  uploader: {
    upload: uploadToCloudinary,
  },
};
