const FrameSnapFFmpeg = (function () {
  const debug = new URLSearchParams(location.search).has('debug');
  const log = debug ? console.log.bind(console, '[FFmpeg]') : () => {};

  let ffmpeg = null;
  let loaded = false;
  let loadPromise = null;

  const { FFmpeg } = FFmpegWASM;

  async function load() {
    if (loaded && ffmpeg) return ffmpeg;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        log('Creating FFmpeg instance...');
        const instance = new FFmpeg();
        log('FFmpeg instance created');

        instance.on('log', ({ message }) => {
          if (debug) console.log('[FFmpeg::log]', message);
          const match = message.match(/time=(\d+):(\d+):(\d+\.?\d*)/);
          if (match) {
            const t = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
            const vid = document.getElementById('videoEl');
            const total = vid ? (vid.duration || 1) : 1;
            const pct = Math.min(100, Math.round((t / total) * 100));
            const bar = document.getElementById('progressFill');
            const label = document.getElementById('progressLabel');
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = `Extracting frames… ${pct}%`;
          }
        });

        instance.on('error', ({ message }) => {
          console.error('[FFmpeg::error]', message);
        });

        const baseURL = window.location.origin + '/';
        log('Loading FFmpeg core...');
        log('coreURL:', baseURL + 'js/ffmpeg-core.js');
        log('wasmURL:', baseURL + 'js/ffmpeg-core.wasm');

        await instance.load({
          coreURL: baseURL + 'js/ffmpeg-core.js',
          wasmURL: baseURL + 'js/ffmpeg-core.wasm',
        });

        log('FFmpeg loaded successfully');
        ffmpeg = instance;
        loaded = true;
        return ffmpeg;
      } catch (err) {
        log('FFmpeg load failed:', err);
        loaded = false;
        loadPromise = null;
        throw new Error('Failed to load FFmpeg engine: ' + (err.message || err));
      }
    })();

    return loadPromise;
  }

  function isLoaded() { return loaded && ffmpeg !== null; }

  function getInstance() {
    if (!ffmpeg) throw new Error('FFmpeg not loaded yet.');
    return ffmpeg;
  }

  return { load, isLoaded, getInstance };
})();
