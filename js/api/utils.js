import { cloudName, uploadPreset } from './cloudinary.js';

// Cloudinary Upload
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST', body: formData
        });
        const data = await res.json();
        return data.secure_url;
    } catch (error) {
        throw new Error("Image upload failed");
    }
}

export function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

export function openModal(id) {
    document.getElementById(id).classList.add('show');
}

// Attach to window for inline event handlers (optional, kept for compatibility)
window.closeModal = closeModal;
window.openModal = openModal;