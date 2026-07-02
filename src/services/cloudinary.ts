import axios from "axios";

export async function uploadImage(file: File | Blob) {
    const formData = new FormData();

    const filename = file instanceof File ? file.name : `photostrip-${Date.now()}.webp`;
    formData.append("file", file, filename);

    formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
    );

    return response.data;
}