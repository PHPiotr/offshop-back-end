const express = require('express');
const {Schema} = require('mongoose');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const deliveryMethods = require('../../routes/deliveryMethods');
const queryOptionsCheck = require('../../middleware/queryOptionsCheck');
const errorHandler = require('../../routes/errorHandler')(false);

chai.use(chaiHttp);
chai.should();

const DeliveryMethodSchema = require('../../schemas/DeliveryMethodSchema')({Schema, slugify});

describe('deliveryMethods', () => {

    it('should fetch delivery methods', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
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
            const res = await chai.request(app).get('/delivery-methods');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.should.be.a('array');
            responseBody.length.should.be.eql(1);
            responseBody[0].should.be.eql('Foo');
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching delivery methods fails', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
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
            const res = await chai.request(app).get('/delivery-methods');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

    it('should fetch delivery method', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/delivery-methods/foo');
            res.should.have.status(200);
            const responseBody = JSON.parse(res.body);
            responseBody.foo.should.be.eql('bar');
        } catch (e) {
            throw e;
        }
    });

    it('should send 404 status if delivery method does not exist', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            DeliveryMethodSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        try {
            const res = await chai.request(app).get('/delivery-methods/foo');
            res.should.have.status(404);
        } catch (e) {
            throw e;
        }
    });

    it('should catch error and pass it to next middleware when fetching delivery method fails', async () => {
        const app = express();
        app.use('/delivery-methods', deliveryMethods({
            model: (name, schema) => ({
                findOne: () => ({
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

});
