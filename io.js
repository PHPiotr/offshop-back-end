const sio = require('socket.io');
const logger = require('./logger');

let io = null;

module.exports.initialize = (http, config) => {
    io = sio(http, config);
    io.on('connect', socket => {
        const {id} = socket;
        logger.info(`${id} connected`);
        socket.on('disconnect', () => {
            logger.info(`${id} disconnected`);
        });
    });
};

module.exports.io = () => io;
