module.exports = s3 => async (Body, Key, ACL = 'public-read') => await s3.upload({Body, Key, ACL}).promise();
