'use strict';

const uuid = require('uuid/v4');
const dynamoDb = require('serverless-dynamodb-client').doc;

module.exports.list = async (event, context) => {
    const params = {
        TableName: 'products',
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (e) {
        console.log(e);
        return {
            statusCode: e.statusCode || 500,
            body: JSON.stringify(e),
        };
    }
};

module.exports.get = async (event, context) => {
    const params = {
        TableName: 'products',
        Key: {
            id: event.pathParameters.id,
        },
    };

    try {
        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            return {
                statusCode: 200,
                body: JSON.stringify(result.Item),
            };
        }
        return {
            statusCode: 404,
            body: JSON.stringify({message: 'Could not find the product.'}),
        };
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify(e),
        };
    }

};

module.exports.create = async (event, context) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: 'products',
        Item: {
            id: uuid(),
            text: data.text,
            checked: false,
        }
    };

    await dynamoDb.put(params).promise();

    return {
        statusCode: 201,
        body: JSON.stringify(params.Item),
    };
};
