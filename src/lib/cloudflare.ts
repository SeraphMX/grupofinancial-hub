interface UploadResponse {
  success: boolean;
  fileName: string;
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

    const response = await fetch('http://3.90.27.51:3000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al subir el archivo');
    }

    return {
      success: true,
      fileName: data.fileName,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      fileName: '',
      error: error instanceof Error ? error.message : 'Error al subir el archivo',
    };
  }
}