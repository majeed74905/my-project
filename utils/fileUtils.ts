import { Attachment } from '../types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const createAttachment = async (file: File): Promise<Attachment> => {
  const base64 = await fileToBase64(file);
  return {
    id: crypto.randomUUID(),
    file,
    base64,
    mimeType: file.type,
    previewUrl: URL.createObjectURL(file),
  };
};

export const validateFile = (file: File): string | null => {
  const MAX_SIZE = 15 * 1024 * 1024; // Increased to 15MB for small videos and complex PDFs
  if (file.size > MAX_SIZE) {
    return 'File size exceeds 15MB limit.';
  }

  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'text/plain',
    'text/javascript',
    'text/x-python',
    'text/html',
    'text/css',
    'application/json',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'application/msword' // doc
  ];

  // Loose check for text files if mime type is missing or generic
  if (file.type.startsWith('text/') || allowedTypes.includes(file.type)) {
    return null;
  }

  return 'Unsupported file type. Please upload images, videos (MP4/WebM), PDFs, or text files.';
};
