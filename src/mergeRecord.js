/**
 * 合并录制，canvas转视频
 * 第一种方案：手动拼接 blob 再下载
 * 行不通，因为看上去 canvas.toBlob() 无法将 blob 的类型指定为视频格式
 */
((global) => {
  const { localVideo, captureVideo } = global
  const mergeRecord = document.getElementById('mergeRecord');

  let mergeRecorderBuffer = []

  let isMergeRecording = false

  let timer

  let mergeCanvas

  function startMergeRecord() {
    mergeRecorderBuffer = []

    mergeCanvas = document.createElement('canvas')
    mergeCanvas.width = localVideo.width + captureVideo.width + 100
    mergeCanvas.height = Math.max(localVideo.height, captureVideo.height)
    const context = mergeCanvas.getContext('2d')

    const draw = () => {
      context.drawImage(localVideo, 0, 0, localVideo.width, localVideo.height)
      context.drawImage(captureVideo, localVideo.width + 50, 0, captureVideo.width, captureVideo.height)

      mergeCanvas.toBlob(blob => {
        mergeRecorderBuffer.push(blob)
      }, 'video/webm;codecs=vp8')

      timer = global.requestAnimationFrame(draw)
    }

    draw()
  }

  function stopMergeRecord() {
    global.cancelAnimationFrame(timer)
    timer = null
    mergeCanvas = null

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
