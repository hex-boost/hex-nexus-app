import { strapiClient } from '@/lib/strapi.ts';

type Image = {
  id: number;
  name: string;
  documentId: string;
  alternativeText: any;
  caption: any;
  width: number;
  height: number;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: any;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
};

export function useProfileAvatar() {
  async function getDefaultBase64Avatar(username: string) {
    try {
      // Format the username for the API (replace spaces with +)
      const formattedName = username.trim().replace(/\s+/g, '+');

      // Construct the URL for UI Avatars with random background
      const avatarUrl = `https://ui-avatars.com/api/?name=${formattedName}&background=random`;

      // Fetch the image
      const response = await fetch(avatarUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch avatar: ${response.status} ${response.statusText}`);
      }

      // Get the image as blob
      const imageBlob = await response.blob();

      // Convert blob to base64
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
    } catch (error) {
      console.error('Error getting avatar:', error);
      throw error;
    }
  }
  async function uploadImageFromBase64(base64Image: string, fileName: string = 'avatar.png') {
    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1] as string;
    const byteCharacters = atob(base64Data);
    const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Create form data for upload
    const formData = new FormData();
    formData.append('files', blob, fileName);

    // Upload the image to media library
    return await strapiClient.axios.post<Image[]>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Modified updateUserAvatarFromBase64 function that uses the uploadImageFromBase64 function
  async function updateUserAvatarFromBase64(base64Image: string, userId: number) {
    // 1. First upload the image using our extracted function
    const uploadResponse = await uploadImageFromBase64(base64Image);

    const uploadedFileId = uploadResponse.data[0].id;

    // 2. Then update your profile using /me endpoint
    const res = await strapiClient.axios.put(`/users/${userId}`, {
      avatar: uploadedFileId,
    });

    return res.data;
  }
  return { updateUserAvatarFromBase64, uploadImageFromBase64, getDefaultBase64Avatar };
}
