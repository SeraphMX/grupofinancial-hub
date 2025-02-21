import { supabase } from './supabase';

interface UploadResponse {
  success: boolean;
  url: string;
  error?: string;
}

export async function uploadToR2(
  file: File,
  folder: string = 'documents'
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const { data, error } = await supabase.functions.invoke('upload-document', {
      body: formData,
    });

    if (error) throw error;

    return data as UploadResponse;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      url: '',
      error: 'Error al subir el archivo',
    };
  }
}