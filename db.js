const oracledb = require('oracledb');

async function initializeDB() {
  try {
    await oracledb.createPool({
      user: 'sns',
      password: 'sns',
      connectString: 'localhost/XE'
    });
    console.log('Oracle DB 연결 성공');
  } catch (err) {
    console.error('Oracle DB 연결 실패', err);
  }
}

async function closeDB() {
  try {
    await oracledb.getPool().close(0);
    console.log('Oracle DB 연결 종료');
  } catch (err) {
    console.error(err);
  }
}

module.exports = { initializeDB, closeDB };
