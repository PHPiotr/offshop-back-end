const express = require('express');
const {Schema} = require('mongoose');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const orders = require('../../../routes/admin/orders');
const queryOptionsCheck = require('../../../middleware/queryOptionsCheck');
const errorHandler = require('../../../routes/errorHandler')(false);
const {possibleOrderStatuses} = require('../../../utils/getPossibleOrderStatuses');

chai.use(chaiHttp);
chai.should();

const OrderSchema = require('../../../schemas/OrderSchema')({Schema, possibleOrderStatuses});

describe('admin orders', () => {

    it('should fetch orders', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => JSON.stringify(['Foo']),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/orders');
        res.should.have.status(200);
        const responseBody = JSON.parse(res.body);
        responseBody.should.be.a('array');
        responseBody.length.should.be.eql(1);
        responseBody[0].should.be.eql('Foo');
    });

    it('should catch error and pass it to next middleware when fetching admin orders fails', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).get('/admin/orders');
        res.should.have.status(500);
    });

    it('should fetch admin order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/orders/foo');
        res.should.have.status(200);
        const responseBody = JSON.parse(res.body);
        responseBody.foo.should.be.eql('bar');
    });

    it('should send 404 status if admin order does not exist', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/orders/foo');
        res.should.have.status(404);
    });

    it('should catch error and pass it to next middleware when fetching admin order fails', async () => {
        const app = express();
        app.use('/orders', orders({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).get('/orders/foo');
        res.should.have.status(500);
    });

    it('should cancel order', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => ({foo: 'bar'}),
                }),
                findOneAndUpdate: () => ({
                    exec: async () => ({fizz: 'buzz'}),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
            axios: () => ({data: {extOrderId: 'foo'}}),
        }));
        const res = await chai.request(app).put('/admin/orders/foo');
        res.should.have.status(200);
        res.body.fizz.should.eql('buzz');
    });

    it('should respond with 404 if trying to cancel non-existing order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).put('/admin/orders/foo');
        res.should.have.status(404);
    });

    it('should catch error o cancel order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => {
                        throw new Error();
                    },
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).put('/admin/orders/foo');
        res.should.have.status(500);
    });

    it('should catch error on cancel order from back-end api request', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => ({foo: 'bar'}),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
            axios: () => ({data: {error: 'foo'}}),
        }));
        app.use(errorHandler);
        const res = await chai.request(app).put('/admin/orders/foo');
        res.should.have.status(500);
    });

    it('should delete order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => ({foo: 'bar'}),
                }),
                findOneAndUpdate: () => ({
                    exec: async () => ({fizz: 'buzz'}),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).delete('/admin/orders/foo');
        res.should.have.status(204);
    });

    it('should respond with 404 if trying to delete non-existing order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).delete('/admin/orders/foo');
        res.should.have.status(404);
    });

    it('should catch error on delete order', async () => {
        const app = express();
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => {
                        throw new Error();
                    },
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).delete('/admin/orders/foo');
        res.should.have.status(500);
    });

    it('should refund order', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => ({foo: 'bar'}),
                }),
                findOneAndUpdate: () => ({
                    exec: async () => ({fizz: 'buzz'}),
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
            axios: () => ({status: 200, data: {refund: {fizz: 'buzz'}}}),
        }));
        const res = await chai.request(app).post('/admin/orders/foo/refunds');
        res.should.have.status(200);
    });

    it('should respond with 404 when trying to refund non-existing order', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).post('/admin/orders/foo/refunds');
        res.should.have.status(404);
    });

    it('should catch error when trying to refund order', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/orders', orders({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            OrderSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).post('/admin/orders/foo/refunds');
        res.should.have.status(500);
    });

});
