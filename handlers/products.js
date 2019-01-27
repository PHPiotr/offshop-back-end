'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const client = new AWS.DynamoDB.DocumentClient();

module.exports.get = async (event, context) => {
    const params = {
        TableName: 'products',
        Key: {
            id: event.pathParameters.id,
        },
    };

    try {
        const result = await client.get(params).promise();
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
        },
    };

    await client.put(params).promise();

    return {
        statusCode: 201,
        body: JSON.stringify(data),
    };
};
