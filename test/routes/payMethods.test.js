const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const errorHandler = require('../../routes/errorHandler')(false);
const payMethods = require('../../routes/payMethods');
const accessTokenCheck = require('../../middleware/accessTokenCheck');

chai.use(chaiHttp);
chai.should();

describe('payMethods', () => {

    it('should fetch enabled pay methods', async () => {
        const app = express();
        app.use((req, res, next) => {
            req.headers.authorization = 'Bearer foo.bar.baz';
            next();
        });
        app.use('/pay-methods', payMethods({
            accessTokenCheck,
            axios: () => ({
                data: {
                    cardTokens: [
                        {
                            name: 'foo',
                            status: 'ENABLED',
                        }
                    ],
                    payByLinks: [
                        {
                            name: 'bar',
                            status: 'ENABLED',
                        },
                        {
                            name: 'baz',
                            status: 'DISABLED',
                        },
                    ],
                    pexTokens: [
                        {
                            name: 'fizz',
                            status: 'DISABLED',
                        },
                        {
                            name: 'buzz',
                            status: 'ENABLED',
                        },
                    ],
                },
            }),
            router: express.Router(),
            url: 'https://pay-methods.api.com/foo',
        }));
        try {
            const res = await chai.request(app).get('/pay-methods');
            res.should.have.status(200);
            res.body.cardTokens.length.should.be.eql(1);
            res.body.cardTokens[0].name.should.be.eql('foo');
            res.body.payByLinks.length.should.be.eql(1);
            res.body.payByLinks[0].name.should.be.eql('bar');
            res.body.pexTokens[0].name.should.be.eql('buzz');
            res.body.pexTokens.length.should.be.eql(1);
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching pay methods fails', async () => {
        const app = express();
        app.use((req, res, next) => {
            req.headers.authorization = 'Bearer foo.bar.baz';
            next();
        });
        app.use('/pay-methods', payMethods({
            accessTokenCheck,
            axios: () => {throw new Error('Foo')},
            router: express.Router(),
            url: 'https://pay-methods.api.com/foo',
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/pay-methods');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

});
