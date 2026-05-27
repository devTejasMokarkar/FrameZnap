(function () {
  let videoFile = null;
  let frames = [];

  const { fetchFile } = FFmpegUtil;
const debug = new URLSearchParams(location.search).has('debug');
const log = debug ? console.log.bind(console, '[App]') : () => {};

  const $ = (id) => document.getElementById(id);

  const dropZone = $('dropZone');
  const fileInput = $('fileInput');
  const convertBtn = $('convertBtn');
  const videoPreviewWrap = $('videoPreviewWrap');
  const videoEl = $('videoEl');
  const fileInfo = $('fileInfo');
  const progressWrap = $('progressWrap');
  const progressFill = $('progressFill');
  const progressLabel = $('progressLabel');
  const resultsWrap = $('resultsWrap');
  const resultCount = $('resultCount');
  const framesGrid = $('framesGrid');
  const fpsSelect = $('fpsSelect');
  const widthSelect = $('widthSelect');
  const qualitySelect = $('qualitySelect');
  const startTime = $('startTime');
  const endTime = $('endTime');

  // ─── Drag & Drop ─────────────────────────────────────────────────

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  // ─── File handling ────────────────────────────────────────────────

  function handleFile(file) {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      Toast.error(validation.error, 'Invalid file');
      return;
    }

    videoFile = file;
    frames = [];
    resultsWrap.style.display = 'none';

    const url = URL.createObjectURL(file);
    videoEl.src = url;
    videoPreviewWrap.style.display = 'block';

    videoEl.onloadedmetadata = () => {
      const dur = videoEl.duration;
      fileInfo.innerHTML = `
        <span>📄 <strong>${file.name}</strong></span>
        <span>📦 ${getFileSizeLabel(file.size)}</span>
        <span>⏱ ${formatTime(dur)}</span>
        <span>📐 ${videoEl.videoWidth}×${videoEl.videoHeight}px</span>
      `;
      if (!endTime.value) {
        endTime.placeholder = `${Math.floor(dur)} (full)`;
      }
      convertBtn.disabled = false;
      Toast.success(`"${file.name}" loaded (${getFileSizeLabel(file.size)})`, 'Video ready');
    };

    videoEl.onerror = () => {
      Toast.error('Failed to load video preview. The file may be corrupted or unsupported.', 'Preview error');
      convertBtn.disabled = true;
    };
  }

  // ─── Conversion ───────────────────────────────────────────────────

  async function startConversion() {
    if (!videoFile) {
      Toast.warning('Please upload a video file first.', 'No video');
      return;
    }

    const fps = fpsSelect.value;
    const width = widthSelect.value;
    const quality = qualitySelect.value;
    const startT = parseFloat(startTime.value) || 0;
    const endT = parseFloat(endTime.value) || null;

    if (endT && endT <= startT) {
      Toast.error('End time must be greater than start time.', 'Invalid time range');
      return;
    }

    progressWrap.style.display = 'block';
    resultsWrap.style.display = 'none';
    framesGrid.innerHTML = '';
    convertBtn.disabled = true;
    progressLabel.textContent = 'Initializing…';
    progressFill.style.width = '2%';
    frames = [];

    try {
      log('Starting conversion...');
      log('fps:', fps, 'width:', width, 'quality:', quality, 'start:', startT, 'end:', endT);
      progressLabel.textContent = 'Loading FFmpeg engine…';
      const ffmpeg = await FrameSnapFFmpeg.load();
      progressFill.style.width = '15%';

      progressLabel.textContent = 'Writing video to memory…';
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
      progressFill.style.width = '25%';

      const args = [];
      if (startT > 0) args.push('-ss', String(startT));
      args.push('-i', 'input.mp4');
      if (endT) args.push('-t', String(endT - startT));

      let vf = `fps=${fps}`;
      if (width) vf += `,scale=${width}:-2`;
      args.push('-vf', vf);
      args.push('-qscale:v', quality, 'frame_%04d.jpg');

      progressLabel.textContent = 'Extracting frames…';
      progressFill.style.width = '40%';
      log('FFmpeg exec args:', args);
      await ffmpeg.exec(args);
      log('FFmpeg exec completed');
      progressFill.style.width = '70%';

      progressLabel.textContent = 'Reading output frames…';
      const files = await ffmpeg.listDir('/');
      const frameFiles = files
        .filter((f) => f.name && f.name.startsWith('frame_') && f.name.endsWith('.jpg'))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (frameFiles.length === 0) {
        throw new Error(
          'No frames were extracted. The video may be corrupted, the time range may be empty, or the format is unsupported.'
        );
      }

      progressLabel.textContent = `Processing ${frameFiles.length} frames…`;
      progressFill.style.width = '85%';

      for (const f of frameFiles) {
        const data = await ffmpeg.readFile(f.name);
        const blob = new Blob([data.buffer], { type: 'image/jpeg' });
        frames.push({ name: f.name, blob, url: URL.createObjectURL(blob) });
      }

      progressFill.style.width = '95%';

      try { await ffmpeg.deleteFile('input.mp4'); } catch (_) {}
      for (const f of frameFiles) {
        try { await ffmpeg.deleteFile(f.name); } catch (_) {}
      }

      displayFrames();
      Toast.success(`Successfully extracted ${frames.length} frame(s)!`, 'Done');

    } catch (err) {
      console.error('[FrameSnap] Conversion error:', err);
      progressLabel.textContent = 'Conversion failed.';
      Toast.error(formatErrorMessage(err), 'Conversion error');
    } finally {
      convertBtn.disabled = false;
      progressFill.style.width = '100%';
    }
  }

  // ─── Display ──────────────────────────────────────────────────────

  function displayFrames() {
    progressWrap.style.display = 'none';
    resultsWrap.style.display = 'block';
    resultCount.textContent = `✅ ${frames.length} frame${frames.length !== 1 ? 's' : ''} extracted`;

    framesGrid.innerHTML = '';
    for (let i = 0; i < frames.length; i++) {
      const item = document.createElement('div');
      item.className = 'frame-item';
      item.innerHTML = `
        <img src="${frames[i].url}" alt="Frame ${i + 1}" loading="lazy">
        <div class="frame-label">Frame ${i + 1}</div>
        <button class="frame-dl" title="Download frame" data-index="${i}">⬇</button>
      `;
      item.querySelector('.frame-dl').addEventListener('click', () => downloadFrame(i));
      framesGrid.appendChild(item);
    }
  }

  // ─── Download ─────────────────────────────────────────────────────

  function downloadFrame(i) {
    if (!frames[i]) return;
    const a = document.createElement('a');
    a.href = frames[i].url;
    a.download = frames[i].name;
    a.click();
    Toast.info(`Downloading ${frames[i].name}…`, 'Download');
  }

  async function downloadAll() {
    if (!frames.length) {
      Toast.warning('No frames to download.', 'Nothing to download');
      return;
    }

    try {
      if (!window.JSZip) {
        Toast.info('Loading JSZip library…', 'Please wait');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      }
      const zip = new JSZip();
      for (const f of frames) {
        const ab = await f.blob.arrayBuffer();
        zip.file(f.name, ab);
      }
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `framesnap_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(`Downloaded ${frames.length} frame(s) as ZIP.`, 'Download complete');
    } catch (err) {
      console.error('[FrameSnap] ZIP error:', err);
      Toast.error(formatErrorMessage(err), 'ZIP error');
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────

  function resetTool() {
    for (const f of frames) URL.revokeObjectURL(f.url);
    frames = [];
    videoFile = null;
    fileInput.value = '';
    videoPreviewWrap.style.display = 'none';
    resultsWrap.style.display = 'none';
    progressWrap.style.display = 'none';
    progressFill.style.width = '0%';
    convertBtn.disabled = true;
    Toast.info('Tool has been reset.', 'Reset');
  }

  // ─── FAQ ──────────────────────────────────────────────────────────

  function toggleFaq(btn) {
    const ans = btn.nextElementSibling;
    btn.classList.toggle('open');
    ans.classList.toggle('open');
  }

  // ─── Script loader ────────────────────────────────────────────────

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Failed to load script: ' + src));
      document.head.appendChild(s);
    });
  }

  // ─── Global error handler ─────────────────────────────────────────

  function setupGlobalErrorHandler() {
    window.onerror = function (msg, source, line, col, err) {
      const detail = source ? ` at ${source.split('/').pop()}:${line}:${col}` : '';
      Toast.error(
        `An unexpected error occurred.${detail} Please try again.`,
        'Runtime error',
        8000
      );
      console.error('[FrameSnap] Uncaught error:', msg, source, line, col, err);
      return true;
    };

    window.addEventListener('unhandledrejection', function (e) {
      const reason = e.reason;
      const msg = reason?.message || String(reason);
      Toast.error(msg, 'Unexpected error', 8000);
      console.error('[FrameSnap] Unhandled rejection:', reason);
      e.preventDefault();
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────

  function init() {
    setupGlobalErrorHandler();

    convertBtn.addEventListener('click', startConversion);

    window.startConversion = startConversion;
    window.downloadFrame = downloadFrame;
    window.downloadAll = downloadAll;
    window.resetTool = resetTool;
    window.toggleFaq = toggleFaq;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
