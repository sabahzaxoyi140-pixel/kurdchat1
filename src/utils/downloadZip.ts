// Kurd Chat & Domino Direct ZIP Download Helper

export function downloadProjectZipOffline(): boolean {
  try {
    // 1. Try direct trigger via anchor
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = '/kurd-chat-project.zip';
    a.download = 'kurd-chat-project.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1500);
    return true;
  } catch (err) {
    console.error('Direct download failed, navigating to download page:', err);
    window.location.href = '/download';
    return false;
  }
}
