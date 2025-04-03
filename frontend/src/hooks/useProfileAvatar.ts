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
      const formattedName = username.trim().replace(/\s+/g, '+');
      const avatarUrl = `https://ui-avatars.com/api/?name=${formattedName}&background=random`;
      const response = await fetch(avatarUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch avatar: ${response.status} ${response.statusText}`);
      }
      const imageBlob = await response.blob();
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
    
    const base64Data = base64Image.split(',')[1] as string;
    const byteCharacters = atob(base64Data);
    const byteNumbers = Array.from({ length: byteCharacters.length }, (_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const formData = new FormData();
    formData.append('files', blob, fileName);
    return await strapiClient.axios.post<Image[]>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async function updateUserAvatarFromBase64(base64Image: string, userId: number) {
    const uploadResponse = await uploadImageFromBase64(base64Image);
    const uploadedFileId = uploadResponse.data[0].id;
    const res = await strapiClient.axios.put(`/users/${userId}`, {
      avatar: uploadedFileId,
    });
    return res.data;
  }
  return { updateUserAvatarFromBase64, uploadImageFromBase64, getDefaultBase64Avatar };
}
