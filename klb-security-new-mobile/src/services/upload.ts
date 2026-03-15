export async function uploadImage(uri: string, generateUploadUrl: () => Promise<string>): Promise<string> {
    const uploadUrl = await generateUploadUrl();

    const response = await fetch(uri);
    const blob = await response.blob();

    const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
    });

    if (!result.ok) {
        throw new Error(`Failed to upload image: ${result.statusText}`);
    }

    const { storageId } = await result.json();
    return storageId;
}
