export async function uploadImage(file: File | Blob) {
    const formData = new FormData();

    const filename = file instanceof File ? file.name : `photostrip-${Date.now()}.webp`;
    formData.append("file", file, filename);

    const uploadPreset =
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";
    formData.append("upload_preset", uploadPreset);

    const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

    if (!cloudName || !uploadPreset) {
        throw new Error(
            "Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment variables."
        );
    }

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
}