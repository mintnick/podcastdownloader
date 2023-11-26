chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "download")
      chrome.downloads.download({
        url: request.url,
        filename: request.filename + '.mp3'
      })
  }
);