const sio = require('socket.io');
const logger = require('./logger');

let io = null;

module.exports.initialize = (http, config) => {
    io = sio(http, config);
    io.on('connect', socket => {
        socket.join('users');
        const {id} = socket;
        logger.info(`${id} connected`);
        socket.on('userLoggedIn', () => {
            socket.leave('users', () => {
                logger.info(`${id} leaving users and joins admin`);
            });
            socket.join('admin');
        });
        socket.on('userLoggedOut', () => {
            socket.leave('admin', () => {
                logger.info(`${id} leaving admin and joins users`);
            });
            socket.join('users');
        });
        socket.on('disconnect', () => {
            socket.leave('admin', () => {
                logger.info(`${id} leaving admin`);
            });
            socket.leave('users', () => {
                logger.info(`${id} leaving users`);
            });
        });
    });
};

module.exports.io = () => io;
