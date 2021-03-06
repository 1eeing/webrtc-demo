/**
 * 合并录制，canvas转视频
 * 第二种方案：通过 canvas.captureStream() 将 canvas 转为 stream 再通过 MediaRecorder 录制下载
 */
((global) => {
  const { localVideo, captureVideo } = global
  const mergeRecord = document.getElementById('mergeRecord');

  let mergeRecorderBuffer = []

  let isMergeRecording = false

  let timer

  let mergeCanvas

  let mergeStream

  let mergeRecorder

  function startMergeRecord() {
    mergeRecorderBuffer = []

    const options = {
      mimeType: 'video/webm;codecs=vp8'
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`)
      return
    }

    mergeCanvas = document.createElement('canvas')
    mergeCanvas.width = localVideo.width + captureVideo.width + 100
    mergeCanvas.height = Math.max(localVideo.height, captureVideo.height)

    const context = mergeCanvas.getContext('2d')

    const draw = () => {
      context.drawImage(localVideo, 0, 0, localVideo.width, localVideo.height)
      context.drawImage(captureVideo, localVideo.width + 50, 0, captureVideo.width, captureVideo.height)

      timer = global.requestAnimationFrame(draw)
    }

    draw();

    mergeStream = mergeCanvas.captureStream(25)

    mergeRecorder = new global.MediaRecorder(mergeStream, options)
    mergeRecorder.ondataavailable = global.handleDataAvailable.bind(this, mergeRecorderBuffer)
    mergeRecorder.start(10)
  }

  function stopMergeRecord() {
    global.cancelAnimationFrame(timer)
    timer = null

    mergeRecorder.stop()
    mergeRecorder = null

    mergeCanvas = null
    mergeStream = null

    console.log('mergeRecord finished: ', mergeRecorderBuffer)
  }

  // ------------  事件绑定 ------------
  mergeRecord.addEventListener('click', () => {
    isMergeRecording = !isMergeRecording

    if (isMergeRecording) {
      startMergeRecord()
    } else {
      stopMergeRecord()
      global.downloadRecord(mergeRecorderBuffer, 'merge.webm')
    }
    mergeRecord.innerText = isMergeRecording ? '停止合并录制' : '开始合并录制'
  })
})(window)
