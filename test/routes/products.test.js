const express = require('express');
const chai = require('chai');
const chaiHttp = require('chai-http');
const products = require('../../routes/products');
const queryOptionsCheck = require('../../middleware/queryOptionsCheck');
const errorHandler = require('../../routes/errorHandler');

chai.use(chaiHttp);
chai.should();

describe('products', () => {

    it('should fetch products', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            ProductModel: {
                find: () => ({
                    exec: async () => JSON.stringify(['Foo']),
                }),
                schema: {
                    paths: {},
                },
            },
            router,
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/products');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.should.be.a('array');
            responseBody.length.should.be.eql(1);
            responseBody[0].should.be.eql('Foo');
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching products fails', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            ProductModel: {
                find: () => ({
                    exec: async () => {throw new Error('Foo');},
                }),
                schema: {
                    paths: {},
                },
            },
            router,
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/products');
            res.should.have.status(500);
            res.body.message.should.be.eql('Foo');
        } catch (e) {
            throw e;
        }
    });

    it('should fetch product', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            ProductModel: {
                findOne: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema: {
                    paths: {},
                },
            },
            router,
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/products/foo');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.foo.should.be.eql('bar');
        } catch (e) {
            throw e;
        }
    });

    it('should send 404 status if product does not exist', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            ProductModel: {
                findOne: () => ({
                    exec: async () => null,
                }),
                schema: {
                    paths: {},
                },
            },
            router,
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/products/foo');
            res.should.have.status(404);
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching product fails', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            ProductModel: {
                findOne: () => ({
                    exec: async () => {throw new Error('Foo');},
                }),
                schema: {
                    paths: {},
                },
            },
            router,
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/products/foo');
            res.should.have.status(500);
            res.body.message.should.be.eql('Foo');
        } catch (e) {
            throw e;
        }
    });

});
