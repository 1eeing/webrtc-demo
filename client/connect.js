((global) => {
  const roomIdContainer = document.getElementById('roomId')
  const joinRoomButton = document.getElementById('joinRoom')
  const remoteVideo = document.getElementById('remoteVideo')

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


  // ---------- RTCPeerConnection  ----------
  const pc = new RTCPeerConnection()

  // 收集本端 ICE 候选
  pc.onicecandidate = handleIcecandidate

  pc.onicecandidateerror = handleIcecandidateError

  pc.onaddstream = handleAddstream

  pc.oniceconnectionstatechange = handleIceconnectionstatechange

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

  joinRoomButton.addEventListener('click', joinSignalRoom)
})(window)
