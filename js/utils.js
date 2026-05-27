function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getFileSizeLabel(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function getVideoFileExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext;
}

function validateVideoFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|mov|avi|mkv|webm|flv|ogg|m4v|wmv|3gp|mpeg|ts|mts|vob)$/i)) {
    return { valid: false, error: 'Unsupported video format. Please upload a valid video file.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The file is empty.' };
  }
  return { valid: true };
}

function formatErrorMessage(err) {
  if (!err) return 'An unknown error occurred.';
  if (err.message) return err.message;
  return String(err);
}
