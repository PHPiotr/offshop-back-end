const express = require('express');
const {Schema} = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const products = require('../../routes/products');
const queryOptionsCheck = require('../../middleware/queryOptionsCheck');
const errorHandler = require('../../routes/errorHandler')(false);

chai.use(chaiHttp);
chai.should();

const ProductSchema = require('../../schemas/ProductSchema')({Schema, uniqueValidator, slugify});

describe('products', () => {

    describe('query params validation', () => {

        const app = express();
        const router = express.Router();
        let queryParams;

        [
            [2, 1, 1, 'name', 2, 1, 1, 'name'],
            [2, 1, 1, 'foo', 2, 1, 1, 'updatedAt'],
            [2, 1, 'foo', 'bar', 2, 1, -1, 'updatedAt'],
            ['foo', 'bar', 'baz', 'name', null, 0, -1, 'name'],
            ['foo', null, null, null, null, 0, -1, 'updatedAt'],
            ['console.log(1)', undefined, NaN, null, null, 0, -1, 'updatedAt'],
            ['console.log(1)', "eval('console.log(1)')", NaN, null, null, 0, -1, 'updatedAt'],
            [{}, [], NaN, undefined, null, 0, -1, 'updatedAt'],
            ['2bar', '1foo', NaN, undefined, null, 0, -1, 'updatedAt'],
        ].forEach(([limit, skip, order, sort, expectedLimit, expectedSkip, expectedOrder, expectedSort]) => {

            it(`should fetch products (actual: limit=${limit} skip=${skip} order=${order} sort=${sort} / expected: limit=${expectedLimit} skip=${expectedSkip} order=${expectedOrder} sort=${expectedSort}`, async () => {
                app.use('/products', products({
                    model: (name, schema) => ({
                        find: (predicate, projection, query) => {
                            queryParams = query;
                            return {
                                exec: async () => JSON.stringify(['Foo']),
                            };
                        },
                        schema,
                    }),
                    ProductSchema,
                    router,
                    queryOptionsCheck,
                }));
                try {
                    const res = await chai.request(app).get(`/products?limit=${limit}&skip=${skip}&order=${order}&sort=${sort}`);
                    queryParams.sort[expectedSort].should.be.eql(expectedOrder);
                    chai.expect(queryParams.limit).to.eql(expectedLimit);
                    queryParams.skip.should.be.eql(expectedSkip);
                    res.should.have.status(200);
                    const responseBody = JSON.parse(res.body);
                    responseBody.should.be.a('array');
                    responseBody.length.should.be.eql(1);
                    responseBody[0].should.be.eql('Foo');
                } catch (e) {
                    throw e;
                }
            });
        });

    });

    it('should catch error and pass it to next middleware when fetching products fails', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            ProductSchema,
            router,
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/products');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

    it('should fetch product', async () => {
        const app = express();
        const router = express.Router();
        app.use('/products', products({
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema,
            }),
            ProductSchema,
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
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            ProductSchema,
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
            model: (name, schema) => ({
                findOne: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            ProductSchema,
            router,
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        try {
            const res = await chai.request(app).get('/products/foo');
            res.should.have.status(500);
        } catch (e) {
            throw e;
        }
    });

});
