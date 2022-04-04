((global) => {
  const roomIdContainer = document.getElementById('roomId')
  const joinRoomButton = document.getElementById('joinRoom')
  const remoteVideo = document.getElementById('remoteVideo')
  const printStatsButton = document.getElementById('printStats')
  const readContainer = document.getElementById('dataChannelRead')
  const writeContainer = document.getElementById('dataChannelWrite')
  const sendTextButton = document.getElementById('sendText')
  const sendFileButton = document.getElementById('sendFile')
  const uploadFileButton = document.getElementById('uploadFile')
  const dataChannelContainer = document.getElementById('dataChannelContainer')

  const recievedFile = {
    name: '',
    size: 0,
    type: '',
    buffer: [],
    recievedSize: 0,
  }

  let statsTimer
  let isPrintingStats = false

  // ----------  信令服务器  ----------
  const socket = global.io('ws://localhost:3000')

  socket.on('full', (roomId, uid) => {
    console.log(`房间 ${roomId} 已满`)
  })

  socket.on('empty', roomId => {
    console.log(`房间 ${roomId} 已空`)
  })

  socket.on('join', (roomId, uid) => {
    console.log(`${uid} 加入房间 ${roomId}`)

    startCall()
  })

  socket.on('joined', (roomId, uid) => {
    console.log(`本端加入房间 ${roomId}，uid: ${uid}`)
  })

  socket.on('created', (roomId, uid) => {
    console.log(`房间 ${roomId} 创建成功，uid: ${uid}`)
  })

  socket.on('offer', (roomId, offer) => {
    console.log(`收到房间 ${roomId} 的 offer`)
    pc.setRemoteDescription(offer)

    answer()
  })

  socket.on('candidate', (roomId, candidate) => {
    console.log(`收到房间 ${roomId} 的 candidate：`, candidate)

    if (candidate) {
      const newIceCandidate = new RTCIceCandidate(candidate)
      pc.addIceCandidate(newIceCandidate)
    }
  })

  socket.on('answer', (roomId, answer) => {
    console.log(`收到房间 ${roomId} 的 answer`)
    pc.setRemoteDescription(answer)
  })

  socket.on('fileInfo', (roomId, data) => {
    console.log(`收到房间 ${roomId} 的 fileInfo：`, data)
    try {
      data = JSON.parse(data)

      recievedFile.name = data.name
      recievedFile.size = data.size
      recievedFile.type = data.type
    } catch (error) {
      throw new Error('fileInfo 数据格式错误： ', error)
    }
  })


  // ---------- RTCPeerConnection  ----------
  const pc = new RTCPeerConnection()

  // 收集本端 ICE 候选
  pc.onicecandidate = handleIcecandidate

  pc.onicecandidateerror = handleIcecandidateError

  pc.onaddstream = handleAddstream

  pc.oniceconnectionstatechange = handleIceconnectionstatechange

  /**
   * 该回调用于 in - band 方式创建的 dataChannel
   * 一方创建完 dataChannel 后，当 SDP 交换完成并收到消息后，另一方会调用该回调获取到 dataChannel 对象，从而完成数据通信
   * 创建 dataChannel 时 negotiated 传 false
   */
  // pc.ondatachannel = handleDatachannel


  // ---------- RTC dataChannel  ----------
  const dc = pc.createDataChannel('dataChannel', {
    ordered: true,
    maxRetransmits: 30,
    negotiated: true,
    id: 1,
  })

  dc.onopen = handleDataChannelOpen

  dc.onclose = handleDataChannelClose

  dc.onmessage = handleDataChannelMessage

  dc.onerror = handleDataChannelError

  // ---------- Some functions  ----------

  function joinSignalRoom() {
    const roomId = roomIdContainer.value

    if (!roomId) {
      alert('请输入房间号')
      return
    }

    const uid = Math.random().toString(36).substring(2, 7)

    socket.emit('create or join', roomId, uid)
  }

  async function startCall() {
    console.log('call start')

    pc.addStream(global.localStream)



    const offer = await pc.createOffer()
    pc.setLocalDescription(offer)

    console.log('send offer: ', roomIdContainer.value, offer)
    socket.emit('offer', roomIdContainer.value, offer)
  }

  async function answer() {
    console.log('answer start')

    pc.addStream(global.localStream)

    const answer = await pc.createAnswer()
    pc.setLocalDescription(answer)

    console.log('send answer: ', roomIdContainer.value, answer)
    socket.emit('answer', roomIdContainer.value, answer)
  }

  function handleIcecandidate(event) {
      console.log('onicecandidate: ', event)

      socket.emit('candidate', roomIdContainer.value, event.candidate)
  }

  function handleIcecandidateError(err) {
    console.error('onicecandidateerror: ', err)
  }

  function handleAddstream(event) {
    console.log('onaddstream: ', event)
    const stream = event.stream
    remoteVideo.srcObject = stream
  }

  function handleIceconnectionstatechange(event) {
    console.log('oniceconnectionstatechange: ', event)
  }

  // function handleDatachannel(event) {
  //   const dc = event.channel
  //   dc.onmessage = handleDataChannelMessage
  // }

  function handleDataChannelOpen() {
    console.log('dataChannel 已打开')
  }

  function handleDataChannelClose() {
    console.log('dataChannel 已关闭')
  }

  function handleDataChannelMessage(event) {
    console.log('dataChannel 收到消息：', event)

    let data = event.data
    if (data) {
      try {
        data = JSON.parse(data)

        switch (data.type) {
          case 'text':
            readContainer.value += `对方：${data.text} \n`
            break
          case 'file': {
            const buffer = str2ab(data.data);
            recievedFile.buffer.push(buffer)
            recievedFile.recievedSize += buffer.byteLength

            if (recievedFile.recievedSize === recievedFile.size) {
              const blob = new Blob(recievedFile.buffer, { type: 'application/octet-stream' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = recievedFile.name
              a.target = "_blank"
              a.innerText = `对方给你发送了一个文件，点击下载: ${recievedFile.name} (${recievedFile.size} bytes)`
              dataChannelContainer.appendChild(a)
            }
          }
            break
          default:
            break
        }
      } catch (error) {
        throw Error('dataChannel 消息格式错误： ', error)
      }
    }
  }

  function handleDataChannelError(err) {
    console.error('dataChannel have error: ', err)
  }

  function printStats() {
    isPrintingStats = !isPrintingStats

    printStatsButton.innerText = isPrintingStats ? '停止打印数据统计' : '打印数据统计'

    if (isPrintingStats) {
      statsTimer = setInterval(() => {
        if (pc) {
          pc.getStats().then(reports => {
            console.log('---- stats start: ')
            reports.forEach(item => {
              console.log(item)
            })
            console.log('---- stats end')
          })
        }
      }, 2000)
    } else {
      clearInterval(statsTimer)
      statsTimer = null
    }
  }

  function sendText() {
    const text = writeContainer.value

    if (!text) {
      alert('请输入要发送的文本')
      return
    }

    const data = {
      type: 'text',
      text: text,
    }

    dc.send(JSON.stringify(data))
    readContainer.value += `我：${text} \n`
  }

  function sendFile() {
    const file = uploadFileButton.files[0]

    if (!file) {
      alert('请选择要发送的文件')
      return
    }

    sendFileInfo(file)
    sendFileSlice(file)
  }

  function sendFileSlice(file) {
    let offset = 0
    const chunkSize = 16384

    const fileReader = new FileReader()

    const readSlice = (o) => {
      const slice = file.slice(o, o + chunkSize)
      fileReader.readAsArrayBuffer(slice)
    }

    fileReader.onload = e => {
      console.log('fileReader onload: ', e)

      const data = {
        type: 'file',
        data: ab2str(e.target.result),
      }

      dc.send(JSON.stringify(data))

      // 更新偏移量
      offset += e.target.result.byteLength

      if (offset < file.size) {
        readSlice(offset)
      }
    }

    readSlice(offset)
  }

  function sendFileInfo(file) {
    const data = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }

    socket.emit('fileInfo', roomIdContainer.value, JSON.stringify(data))
  }

  function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
  }

  // 字符串转为ArrayBuffer对象，参数为字符串
  function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  // ---------- Dom events  ----------
  joinRoomButton.addEventListener('click', joinSignalRoom)

  printStatsButton.addEventListener('click', printStats)

  sendTextButton.addEventListener('click', sendText)

  sendFileButton.addEventListener('click', sendFile)
})(window)
