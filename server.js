const express = require('express');
const { WebSocketServer } = require('ws');
const { initializeDB, closeDB } = require('./db');
const oracledb = require('oracledb');

const app = express();
const PORT = process.env.PORT || 5000;

initializeDB();

// WebSocket 서버 생성
const wss = new WebSocketServer({ noServer: true });

// WebSocket 클라이언트 연결 처리
wss.on('connection', (ws) => {
  console.log('클라이언트 연결되었습니다....');
  // console.log('ws:',ws);

  // 클라이언트 메시지 수신 처리
  ws.on('message', async (data) => {
    const messageData = JSON.parse(data);
    var { username, message } = messageData;
    console.log('username',username);
    console.log('message:',message);

    // Oracle DB에 메시지 저장
    let connection;
    try {
      connection = await oracledb.getConnection();
      await connection.execute(
        `INSERT INTO chat_messages (username, message) VALUES (:username, :message)`,
        [username, message]
      );
      await connection.commit();  // 트랜잭션 커밋
      console.log("DB입력되었습니다.");
    } catch (err) {
      console.error('DB 저장 실패:', err);
    } finally {
      if (connection) await connection.close();
    }

    // 모든 클라이언트에게 메시지 전송
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ username, message }));
      }
    });
  });

  // 클라이언트 연결 종료 처리
  ws.on('close', () => {
    console.log('클라이언트 연결 종료됨');
  });
});

// Express 서버와 WebSocket 서버 연동
const server = app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  await closeDB();
  process.exit();
});
