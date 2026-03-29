const BUTTON_ID = "pod-dl";
const EPISODE_PATH_PATTERN = /^\/episode\/[^/]+/;
const PAGE_AUDIO_EVENT = "pod-dl-audio-candidate";

let lastUrl = "";
let observerStarted = false;
const runtimeAudioCandidates = new Set();
let renderScheduled = false;
let performanceEntriesScanned = false;

init();

function init() {
  lastUrl = location.href;
  installPageAudioHooks();
  listenForPageAudioCandidates();
  renderOrUpdateButton();
  watchDomChanges();
  watchNavigation();
}

function watchDomChanges() {
  if (observerStarted) {
    return;
  }

  observerStarted = true;

  const observer = new MutationObserver(() => {
    if (!isEpisodePage()) {
      removeButton();
      return;
    }

    scheduleRender();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function watchNavigation() {
  const syncUrl = () => {
    if (location.href === lastUrl) {
      return;
    }

    lastUrl = location.href;
    performanceEntriesScanned = false;
    runtimeAudioCandidates.clear();

    if (!isEpisodePage()) {
      removeButton();
      return;
    }

    scheduleRender();
  };

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    syncUrl();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    syncUrl();
  };

  window.addEventListener("popstate", syncUrl);
}

function isEpisodePage() {
  return EPISODE_PATH_PATTERN.test(location.pathname);
}

function renderOrUpdateButton() {
  const header = document.querySelector("header");

  if (!header) {
    return;
  }

  let button = document.getElementById(BUTTON_ID);
  if (!button) {
    button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "下载音频";
    button.addEventListener("click", handleDownloadClick);
    header.prepend(button);
  } else if (button.parentElement !== header) {
    header.prepend(button);
  }

  const episode = getEpisodeData();

  button.dataset.url = episode.audioUrl || "";
  button.dataset.filename = episode.filename || "";
  button.disabled = !episode.audioUrl;
  button.textContent = episode.audioUrl ? "下载音频" : "等待音频地址";
  button.title = episode.audioUrl ? episode.audioUrl : "未找到音频地址";
}

function scheduleRender() {
  if (renderScheduled) {
    return;
  }

  renderScheduled = true;

  window.requestAnimationFrame(() => {
    renderScheduled = false;
    renderOrUpdateButton();
  });
}

function removeButton() {
  document.getElementById(BUTTON_ID)?.remove();
}

function getEpisodeData() {
  const audioUrl =
    getAudioUrlFromMeta() ||
    getAudioUrlFromJsonLd() ||
    getAudioUrlFromNextData() ||
    getAudioUrlFromAudioElement() ||
    getAudioUrlFromRuntimeCandidates() ||
    getAudioUrlFromPerformanceEntries();

  return {
    audioUrl,
    filename: buildFilename()
  };
}

function getAudioUrlFromMeta() {
  return (
    document
      .querySelector('meta[property="og:audio"]')
      ?.getAttribute("content")
      ?.trim() || ""
  );
}

function getAudioUrlFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const url = item?.associatedMedia?.contentUrl || item?.contentUrl;
        if (typeof url === "string" && url.trim()) {
          return url.trim();
        }
      }
    } catch (_) {
      // Ignore malformed structured data blocks.
    }
  }

  return "";
}

function getAudioUrlFromNextData() {
  const node = document.getElementById("__NEXT_DATA__");
  if (!node?.textContent) {
    return "";
  }

  try {
    const data = JSON.parse(node.textContent);
    return findAudioUrlDeep(data) || "";
  } catch (_) {
    return "";
  }
}

function findAudioUrlDeep(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return isAudioUrl(value) ? value : "";
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findAudioUrlDeep(item);
      if (result) {
        return result;
      }
    }

    return "";
  }

  if (typeof value === "object") {
    const preferredKeys = ["audio", "audioUrl", "audioSrc", "contentUrl", "url"];

    for (const key of preferredKeys) {
      const result = findAudioUrlDeep(value[key]);
      if (result) {
        return result;
      }
    }

    for (const nested of Object.values(value)) {
      const result = findAudioUrlDeep(nested);
      if (result) {
        return result;
      }
    }
  }

  return "";
}

function getAudioUrlFromAudioElement() {
  const audio = document.querySelector("audio");
  return audio?.currentSrc || audio?.src || audio?.getAttribute("src") || "";
}

function getAudioUrlFromRuntimeCandidates() {
  for (const candidate of runtimeAudioCandidates) {
    if (isAudioUrl(candidate)) {
      return candidate;
    }
  }

  return "";
}

function getAudioUrlFromPerformanceEntries() {
  if (performanceEntriesScanned) {
    return "";
  }

  performanceEntriesScanned = true;
  const entries = performance.getEntriesByType("resource");

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const candidate = entries[index]?.name;
    if (isAudioUrl(candidate)) {
      runtimeAudioCandidates.add(candidate);
      return candidate;
    }
  }

  return "";
}

function isAudioUrl(value) {
  return /^https?:\/\//i.test(value) && /\.(mp3|m4a|aac|mp4|wav|flac|ogg)(?:$|[?#])/i.test(value);
}

function rememberAudioCandidate(value) {
  if (!isAudioUrl(value)) {
    return;
  }

  runtimeAudioCandidates.add(value);
}

function listenForPageAudioCandidates() {
  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }

    if (event.data?.source !== PAGE_AUDIO_EVENT || typeof event.data.url !== "string") {
      return;
    }

    rememberAudioCandidate(event.data.url);
    scheduleRender();
  });
}

function installPageAudioHooks() {
  if (document.getElementById("pod-dl-page-hook")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "pod-dl-page-hook";
  script.textContent = `(() => {
    const SOURCE = ${JSON.stringify(PAGE_AUDIO_EVENT)};
    const AUDIO_PATTERN = /https?:\\/\\/[^"'\\s]+\\.(mp3|m4a|aac|mp4|wav|flac|ogg)(?:[?#][^"'\\s]*)?/ig;

    const emit = (value) => {
      if (typeof value !== "string") {
        return;
      }

      const matches = value.match(AUDIO_PATTERN) || [];
      for (const url of matches) {
        window.postMessage({ source: SOURCE, url }, "*");
      }
    };

    const wrapMethod = (target, key, handler) => {
      const original = target?.[key];
      if (typeof original !== "function") {
        return;
      }

      target[key] = function (...args) {
        try {
          handler.apply(this, args);
        } catch (_) {
          // Ignore hook errors and keep page behavior unchanged.
        }

        return original.apply(this, args);
      };
    };

    wrapMethod(window, "fetch", function (input) {
      if (typeof input === "string") {
        emit(input);
      } else if (input?.url) {
        emit(input.url);
      }
    });

    wrapMethod(XMLHttpRequest.prototype, "open", function (_method, url) {
      emit(url);
    });

    wrapMethod(HTMLMediaElement.prototype, "setAttribute", function (name, value) {
      if (name === "src") {
        emit(value);
      }
    });

    const mediaDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src");
    if (mediaDescriptor?.set) {
      Object.defineProperty(HTMLMediaElement.prototype, "src", {
        configurable: true,
        enumerable: mediaDescriptor.enumerable,
        get() {
          return mediaDescriptor.get.call(this);
        },
        set(value) {
          emit(value);
          return mediaDescriptor.set.call(this, value);
        }
      });
    }

    const sourceDescriptor = Object.getOwnPropertyDescriptor(HTMLSourceElement.prototype, "src");
    if (sourceDescriptor?.set) {
      Object.defineProperty(HTMLSourceElement.prototype, "src", {
        configurable: true,
        enumerable: sourceDescriptor.enumerable,
        get() {
          return sourceDescriptor.get.call(this);
        },
        set(value) {
          emit(value);
          return sourceDescriptor.set.call(this, value);
        }
      });
    }
  })();`;

  (document.documentElement || document.head || document.body).append(script);
  script.remove();
}

function buildFilename() {
  const title =
    document.querySelector("header h1")?.textContent?.trim() ||
    document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ||
    document.title.split("|")[0].trim();
  const podcast =
    document.querySelector("header a[href^='/podcast/']")?.textContent?.trim() ||
    extractPodcastFromTitle();

  const baseName = podcast ? `${podcast} - ${title}` : title;

  return sanitizeFilename(baseName || "xiaoyuzhou-episode");
}

function extractPodcastFromTitle() {
  const title = document.title.split("|")[0].trim();
  const segments = title.split(" - ").map((item) => item.trim()).filter(Boolean);
  return segments.length > 1 ? segments[segments.length - 1] : "";
}

function sanitizeFilename(value) {
  return value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

async function handleDownloadClick(event) {
  const button = event.currentTarget;
  const url = button.dataset.url;
  const filename = button.dataset.filename;

  if (!url || !filename) {
    button.textContent = "未找到音频地址";
    return;
  }

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "正在下载...";

  try {
    const response = await chrome.runtime.sendMessage({
      message: "download",
      url,
      filename
    });

    if (!response?.ok) {
      throw new Error(response?.error || "下载失败");
    }

    button.textContent = "已开始下载";
  } catch (error) {
    button.textContent = "下载失败";
    console.error("Podcast download failed:", error);
  } finally {
    window.setTimeout(() => {
      button.disabled = !button.dataset.url;
      button.textContent = button.dataset.url ? originalText : "等待音频地址";
    }, 1800);
  }
}
