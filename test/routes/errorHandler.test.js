const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const errorHandler = require('../../routes/errorHandler');

chai.use(chaiHttp);
chai.should();

describe('errorHandler', () => {

    [
        ['should work in dev mode', true, new Error, 500],
        ['should work in prod mode', false, new Error, 500],
        ['should work if axios error', false, {isAxiosError: true, response: {status: 427}}, 427],
        ['should work if unauthorized error', false, {name: 'UnauthorizedError', status: 401}, 401],
        ['should work if validation error', false, {name: 'ValidationError'}, 422],
        ['should work if validation error with status code', false, {name: 'ValidationError', statusCode: 422}, 422],
        ['should work if mongo error', false, {name: 'MongoError', code: 11000}, 422],
        ['should work if cast error', false, {name: 'CastError'}, 404],
    ].forEach(([should, isDevEnv, error, status]) => {
        it(should, async () => {
            const app = express();
            app.use('/foo', async (req, res, next) => {
                try {
                    throw error;
                } catch (e) {
                    next(e);
                }
            });
            app.use(errorHandler(isDevEnv));
            try {
                const res = await chai.request(app).get('/foo');
                res.should.have.status(status);
            } catch (e) {
                throw e;
            }
        });
    });

});
