chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message !== "download" || !request.url || !request.filename) {
    return false;
  }

  const extension = getExtensionFromUrl(request.url);
  const normalizedFilename = `${request.filename}.${extension}`;

  chrome.downloads.download(
    {
      url: request.url,
      filename: normalizedFilename
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          error: chrome.runtime.lastError.message
        });
        return;
      }

      sendResponse({
        ok: true,
        downloadId
      });
    }
  );

  return true;
});

function getExtensionFromUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const match = url.pathname.match(/\.([a-z0-9]{2,5})$/i);

    if (match) {
      return match[1].toLowerCase();
    }
  } catch (_) {
    // Fall through to the default extension.
  }

  return "mp3";
}
