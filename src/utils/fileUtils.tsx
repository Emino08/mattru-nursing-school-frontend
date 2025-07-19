export async function compressFile(file: File): Promise<File> {
    // Simulated file compression (in real implementation, use a library like image-compressor.js)
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(file); // Return original file for simplicity
        };
        reader.readAsDataURL(file);
    });
}