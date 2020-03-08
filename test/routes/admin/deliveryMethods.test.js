const express = require('express');
const {Schema} = require('mongoose');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const deliveryMethods = require('../../../routes/admin/deliveryMethods');
const queryOptionsCheck = require('../../../middleware/queryOptionsCheck');
const errorHandler = require('../../../routes/errorHandler')(false);

chai.use(chaiHttp);
chai.should();

const DeliveryMethodSchema = require('../../../schemas/DeliveryMethodSchema')({Schema, slugify});

describe('admin deliveryMethods', () => {

    it('should fetch delivery methods', async () => {
        const app = express();
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => JSON.stringify(['Foo']),
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/admin/delivery-methods');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.should.be.a('array');
            responseBody.length.should.be.eql(1);
            responseBody[0].should.be.eql('Foo');
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching admin delivery methods fails', async () => {
        const app = express();
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/admin/delivery-methods');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

    it('should fetch admin delivery method', async () => {
        const app = express();
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/admin/delivery-methods/foo');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.foo.should.be.eql('bar');
        } catch (e) {
            throw e;
        }
    });

    it('should send 404 status if admin delivery method does not exist', async () => {
        const app = express();
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/admin/delivery-methods/foo');
            res.should.have.status(404);
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching admin delivery method fails', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/delivery-methods/foo');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

    it('should add delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: () => {
                return class {
                    save() {
                        return {
                            id: 'fizz',
                        };
                    }
                }
            },
            apiUrl: 'https://example.com',
            io: {to: () => ({emit: () => null})},
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).post('/admin/delivery-methods').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(201);
        res.get('Location').should.be.eql('https://example.com/admin/delivery-methods/fizz');
    });

    it('should fail adding delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: () => {
                return class {
                    save() {
                        throw new Error();
                    }
                }
            },
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).post('/admin/delivery-methods').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(500);
    });

    it('should edit delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => ({
                        id: 'fizz',
                        save: () => {},
                    }),
                }),
                schema,
            }),
            apiUrl: 'https://example.com',
            io: {to: () => ({emit: () => null})},
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).put('/admin/delivery-methods/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(200);
        res.get('Location').should.be.eql('https://example.com/admin/delivery-methods/fizz');
    });

    it('should respond with 404 when trying to edit non-existing delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).put('/admin/delivery-methods/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(404);
    });

    it('should fail editing delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => {
                    throw new Error();
                },
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).put('/admin/delivery-methods/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(500);
    });

    it('should delete delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => ({
                        id: 'fizz',
                        save: () => {},
                    }),
                }),
                deleteOne: () => {},
                schema,
            }),
            io: {to: () => ({emit: () => null})},
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).delete('/admin/delivery-methods/fizz');
        res.should.have.status(204);
    });

    it('should respond with 404 if trying to delete non-existing delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).delete('/admin/delivery-methods/fizz');
        res.should.have.status(404);
    });

    it('should fail deleting delivery method', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findById: () => {
                    throw new Error();
                },
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).delete('/admin/delivery-methods/fizz');
        res.should.have.status(500);
    });

});
