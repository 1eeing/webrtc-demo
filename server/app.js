const server = require('http').createServer()
const io = require('socket.io')(server, {
  cors: true
})

io.on('connection', (socket) => {
  socket.on('message', () => {
    // 对当前 server 下的所有客户端发送消息
    socket.broadcast.emit('message', message)
  })

  socket.on('create or join', (room, uid) => {
    const clients = io.sockets.adapter.rooms.get(room)
    const numClients = clients ? clients.size : 0

    if (numClients === 0) {
      socket.join(room)
      // 对当前连接的客户端发送消息
      socket.emit('created', room, uid)
    } else if (numClients === 1) {
      socket.to(room).emit('join', room, uid)
      socket.join(room)
      socket.emit('joined', room, uid)
    } else {
      socket.emit('full', room, uid)
    }

    socket.emit('emit(): client ' + socket.id + ' joined room ' + room)
    socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room)
  })

  socket.on('offer', (room, offer) => {
    socket.to(room).emit('offer', room, offer)
  })

  socket.on('answer', (room, answer) => {
    socket.to(room).emit('answer', room, answer)
  })

  socket.on('candidate', (room, candidate) => {
    socket.to(room).emit('candidate', room, candidate)
  })
})

const port = 3000

server.listen(port, () => {
  console.log(`listening on ${port}`)
})
