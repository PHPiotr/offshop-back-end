'use strict';

process.env.NODE_ENV = 'development';

const dotenv = require('dotenv');
const childProcess = require('child_process');

dotenv.load();
console.log(`ssh -o ServerAliveInterval=${process.env.SERVER_ALIVE_INTERVAL} -R ${process.env.DOMAIN_NAME}.serveo.net:80:localhost:${process.env.PORT} serveo.net`);
childProcess.exec(`ssh -o ServerAliveInterval=${process.env.SERVER_ALIVE_INTERVAL} -R ${process.env.DOMAIN_NAME}.serveo.net:80:localhost:${process.env.PORT} serveo.net`);
