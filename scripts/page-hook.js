(() => {
  const SOURCE = "pod-dl-audio-candidate";
  const AUDIO_PATTERN = /https?:\/\/[^"'\s]+\.(mp3|m4a|aac|mp4|wav|flac|ogg)(?:[?#][^"'\s]*)?/ig;

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
        // Keep page behavior unchanged if the hook fails.
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
})();
