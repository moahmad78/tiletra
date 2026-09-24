import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "fg3w4hig",
  api_key: process.env.CLOUDINARY_API_KEY || "737783455242549",
  api_secret: process.env.CLOUDINARY_API_SECRET || "oGsdOuWVtfER_wH08xL6WWE29cw",
  secure: true,
});

export async function uploadToCloudinary(
  fileData: string | Buffer,
  folder: string = "intrihub",
  publicId?: string
): Promise<UploadApiResponse> {
  let uploadSource = fileData;
  if (Buffer.isBuffer(fileData)) {
    uploadSource = `data:image/jpeg;base64,${fileData.toString("base64")}`;
  }

  return cloudinary.uploader.upload(uploadSource as string, {
    folder,
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
}

export { cloudinary };
