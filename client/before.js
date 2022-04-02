((global) => {
  const localVideo = document.getElementById('localVideo');
  const captureVideo = document.getElementById('captureVideo');
  const screenshot = document.getElementById('screenshot');
  const screenshare = document.getElementById('screenshare');
  const localRecord = document.getElementById('localRecord');
  const captureRecord = document.getElementById('captureRecord');

  let localStream
  let captureStream

  let localRecorder
  let captureRecorder

  let localRecorderBuffer = []
  let captureRecorderBuffer = []

  let isLocalRecording = false
  let isCaptureRecording = false
  let isScreenSharing = false

  async function deviceTest() {
    const devices = await global.navigator.mediaDevices.enumerateDevices()
    console.log('deviceTest: ', devices);
    if (devices.length === 0) {
      console.error('No device found');
      return false
    }
    return true
  }

  function download(url, name) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  function takePhoto() {
    const canvas = document.createElement('canvas')
    canvas.width = localVideo.width
    canvas.height = localVideo.height
    const context = canvas.getContext('2d')
    context.drawImage(localVideo, 0, 0, canvas.width, canvas.height)
    const dataURL = canvas.toDataURL('image/png')
    download(dataURL, 'screenshot.png')
  }

  function downloadRecord(buffer, name) {
    const blob = new Blob(buffer, { type: 'video/webm;codecs=vp8' })
    const url = global.URL.createObjectURL(blob)
    download(url, name)
  }

  function handleDataAvailable(buffer, event) {
    if (event.data && event.data.size > 0) {
      buffer.push(event.data)
    }
  }

  function startLocalRecord() {
    localRecorderBuffer = []

    const options = {
      mimeType: 'video/webm;codecs=vp8'
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`)
      return
    }

    if (localRecorder) {
      console.warn('localRecorder is already extists')
      return;
    }

    localRecorder = new MediaRecorder(localStream, options)

    localRecorder.ondataavailable = handleDataAvailable.bind(this, localRecorderBuffer)
    localRecorder.start(10)
  }

  function stopLocalRecord() {
    localRecorder.stop()
    localRecorder = null

    console.log('localRecord finished: ', localRecorderBuffer)
  }

  function startCaptureRecord() {
    captureRecorderBuffer = []

    const options = {
      mimeType: 'video/webm;codecs=vp8'
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`)
      return
    }

    if (!captureStream) {
      console.error('captureStream is not extists')
      return;
    }

    if (captureRecorder) {
      console.warn('captureRecorder is already extists')
      return;
    }

    captureRecorder = new MediaRecorder(captureStream, options)

    captureRecorder.ondataavailable = handleDataAvailable.bind(this, captureRecorderBuffer)
    captureRecorder.start(10)
  }

  function stopCaptureRecord() {
    captureRecorder.stop()
    captureRecorder = null

    console.log('captureRecord finished: ', captureRecorderBuffer)
  }

  async function startScreenShare() {
    const constraints = {
      video: {
        width: 640,
        height: 480,
        frameRate: 15,
      },
      audio: false
    }

    const stream = await global.navigator.mediaDevices.getDisplayMedia(constraints)
    captureVideo.srcObject = stream
    captureStream = stream

    stream.getVideoTracks()[0].onended = afterToggleScreenShare
  }

  function stopScreenShare() {
    captureStream.getVideoTracks().forEach(track => track.stop())
  }

  function afterToggleScreenShare() {
    isScreenSharing = !isScreenSharing
    screenshare.innerText = isScreenSharing ? '停止屏幕共享' : '开启屏幕共享'
    captureStream = null
    captureVideo.srcObject = null
  }

  async function main() {
    if (!deviceTest()) {
      return
    }

    const constraints = {
      video: {
        width: 640,
        height: 480,
        frameRate: 15,
        facingMode: 'environment'
      },
      audio: {
        // 自动增益
        autoGainControl: true,
        // 回声消除
        echoCancellation: true,
        // 噪声抑制
        noiseSuppression: true,
      }
    }

    const stream = await global.navigator.mediaDevices.getUserMedia(constraints)
    localVideo.srcObject = stream
    global.localStream = localStream = stream
  }

  main()

  // ------------  事件绑定 ------------
  screenshot.addEventListener('click', () => {
    takePhoto()
  })

  screenshare.addEventListener('click', () => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
    afterToggleScreenShare()
  })

  localRecord.addEventListener('click', () => {
    isLocalRecording = !isLocalRecording

    if (isLocalRecording) {
      startLocalRecord()
    } else {
      stopLocalRecord()
      downloadRecord(localRecorderBuffer, 'local.webm')
    }
    localRecord.innerText = isLocalRecording ? '停止本端录制' : '开始本端录制'
  })

  captureRecord.addEventListener('click', () => {
    isCaptureRecording = !isCaptureRecording

    if (isCaptureRecording) {
      startCaptureRecord()
    } else {
      stopCaptureRecord()
      downloadRecord(captureRecorderBuffer, 'capture.webm')
    }
    captureRecord.innerText = isCaptureRecording ? '停止屏幕共享录制' : '开始屏幕共享录制'
  })

  // ------------  export ------------
  global.startLocalRecord = startLocalRecord
  global.stopLocalRecord = stopLocalRecord
  global.startCaptureRecord = startCaptureRecord
  global.stopCaptureRecord = stopCaptureRecord
  global.downloadRecord = downloadRecord
  global.handleDataAvailable = handleDataAvailable
  global.localVideo = localVideo
  global.captureVideo = captureVideo
})(window)
