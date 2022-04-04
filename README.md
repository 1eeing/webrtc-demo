# webrtc-demo

一些 webrtc 相关的操作练习

目前包括
- [x] 打开本地摄像头
- [x] 打开/关闭屏幕共享
- [x] 视频截图
- [x] 单流录制
- [x] 合并录制
- [x] 点对点信令服务器（后续还要优化）
- [x] 加入 RTC 房间进行音视频通话
- [x] RTC 数据统计
- [x] dataChannel（发送文字、发送文件，其中文件支持分片发送）

## 快速启动

### 1. 下载到本地，并安装依赖
```bash
$ git clone git@github.com:1eeing/webrtc-demo.git && cd webrtc-demo && npm install
```

待安装依赖完成后，通过命令分别启动客户端和服务端

### 2. 启动客户端
```bash
$ npm run client
```

### 3. 启动服务端
```bash
$ npm run server
```

成功启动后，通过最新谷歌浏览器访问 [http://localhost:8100/index.html](http://localhost:8100/index.html) 进行体验。
