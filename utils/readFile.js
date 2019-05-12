const fs = require('fs');

module.exports = (file) => {
    return new Promise((resolve, reject) => {
        return fs.readFile(file, (err, buffer) => {
            if (err) {
                return reject(err);
            }
            return resolve(buffer);
        });
    });
};
