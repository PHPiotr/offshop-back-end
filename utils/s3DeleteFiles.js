module.exports = s3 => async keys => {
    await s3.deleteObjects({
        Delete: {
            Objects: keys.map(Key => ({Key})),
        }
    }).promise();
};
