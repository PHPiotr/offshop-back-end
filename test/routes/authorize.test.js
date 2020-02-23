const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const authorize = require('../../routes/authorize');
const errorHandler = require('../../routes/errorHandler')(false);

chai.use(chaiHttp);
chai.should();

describe('authorize', () => {

    describe('data validation', () => {

        [
            [200, '123', 'foo', () => ({fizz: 'buzz'})],
            [401, {}, 'foo', () => null],
            [401, '123', {}, () => null],
            [500, '123', 'foo', () => {throw new Error('Foo')}],
        ].forEach(([status, client_id, client_secret, axios]) => {

            it(`should set status ${status} with client_id: ${client_id}, client_secret: ${client_secret}`, async () => {

                const app = express();
                app.use(express.json());
                app.use('/authorize', authorize({
                    axios,
                    router: express.Router(),
                    url: 'https://authorize.api.com/user/oauth/authorize',
                }));
                app.use(errorHandler);
                try {
                    const res = await chai.request(app).post('/authorize').send({client_id, client_secret});
                    res.should.have.status(status);
                } catch (e) {
                    throw e;
                }

            });
        });

    });

});
