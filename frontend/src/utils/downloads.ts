export async function downloadFileFromUrl(fileUrl: string, fallbackFileName = 'download') {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error('Failed to download file.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const fileName = fileUrl.split('/').pop()?.split('?')[0] || fallbackFileName;
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
