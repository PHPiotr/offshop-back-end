const express = require('express');
const {Schema} = require('mongoose');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const uniqueValidator = require('mongoose-unique-validator');
const {readFileSync} = require('fs');
const fileUpload = require('express-fileupload');
const products = require('../../../routes/admin/products');
const queryOptionsCheck = require('../../../middleware/queryOptionsCheck');
const errorHandler = require('../../../routes/errorHandler')(false);

chai.use(chaiHttp);
chai.should();

const ProductSchema = require('../../../schemas/ProductSchema')({Schema, slugify, uniqueValidator});

describe('admin products', () => {

    it('should fetch products', async () => {
        const app = express();
        app.use('/admin/products', products({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => JSON.stringify(['Foo']),
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/products');
        res.should.have.status(200);
        const responseBody = JSON.parse(res.body);
        responseBody.should.be.a('array');
        responseBody.length.should.be.eql(1);
        responseBody[0].should.be.eql('Foo');
    });

    it('should catch error and pass it to next middleware when fetching admin products fails', async () => {
        const app = express();
        app.use('/admin/products', products({
            model: (name, schema) => ({
                find: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).get('/admin/products');
        res.should.have.status(500);
    });

    it('should fetch admin product', async () => {
        const app = express();
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => JSON.stringify({foo: 'bar'}),
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/products/foo');
        res.should.have.status(200);
        const responseBody = JSON.parse(res.body);
        responseBody.foo.should.be.eql('bar');
    });

    it('should send 404 status if admin product does not exist', async () => {
        const app = express();
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).get('/admin/products/foo');
        res.should.have.status(404);
    });

    it('should catch error and pass it to next middleware when fetching admin product fails', async () => {
        const app = express();
        app.use('/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => {
                        throw new Error('Foo');
                    },
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).get('/products/foo');
        res.should.have.status(500);
    });

    it('should add product', async () => {
        const app = express();
        app.use(express.json());
        app.use(fileUpload({
            safeFileNames: true,
        }));
        app.use('/admin/products', products({
            model: () => {
                return class {
                    save() {
                        return {
                            id: 'fizz',
                            save: () => ({}),
                        };
                    }
                }
            },
            apiUrl: 'https://example.com',
            io: {to: () => ({emit: () => null})},
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
            fileUtils: {
                resizeFile: () => ({}),
                readFile: () => ({}),
                s3UploadFile: () => ({}),
                removeFile: () => ({}),
            },
        }));
        const res = await chai.request(app)
            .post('/admin/products')
            .attach("img", readFileSync("./test/routes/admin/file.test"), "file.test");
        res.should.have.status(201);
        res.get('Location').should.be.eql('https://example.com/admin/products/fizz');
    });

    it('should fail adding product with no image', async () => {
        const app = express();
        app.use(express.json());
        app.use(fileUpload({
            safeFileNames: true,
        }));
        app.use('/admin/products', products({
            model: () => {},
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app)
            .post('/admin/products').send();
        res.should.have.status(400);
    });

    it('should edit product', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => ({
                        id: 'fizz',
                        active: true,
                        save: () => {},
                    }),
                }),
                schema,
            }),
            apiUrl: 'https://example.com',
            io: {to: () => ({emit: () => null})},
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).put('/admin/products/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(200);
        res.get('Location').should.be.eql('https://example.com/admin/products/fizz');
    });

    it('should replace image of product', async () => {
        const app = express();
        app.use(express.json());
        app.use(fileUpload({
            safeFileNames: true,
        }));
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => ({
                        id: 'fizz',
                        active: true,
                        save: () => {},
                    }),
                }),
                schema,
            }),
            apiUrl: 'https://example.com',
            io: {to: () => ({emit: () => null})},
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
            fileUtils: {
                resizeFile: () => ({}),
                readFile: () => ({}),
                s3UploadFile: () => ({
                    Key: 'foo', ETag: 'bar',
                }),
                removeFile: () => ({}),
            },
        }));
        const res = await chai.request(app).put('/admin/products/fizz')
            .attach("img", readFileSync("./test/routes/admin/file.test"), "file.test");;
        res.should.have.status(200);
        res.get('Location').should.be.eql('https://example.com/admin/products/fizz');
    });

    it('should fail editing product', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => {
                        throw new Error();
                    },
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).put('/admin/products/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(500);
    });

    it('should fail if trying to edit non-existing product', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).put('/admin/products/fizz').send({name: 'Foo', slug: 'foo', unitPrice: '1000'});
        res.should.have.status(404);
    });

    it('should delete product', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => ({
                        id: 'fizz',
                    }),
                }),
                deleteOne: () => {},
                schema,
            }),
            io: {to: () => ({emit: () => null})},
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
            fileUtils: {
                s3DeleteFiles: () => ({}),
            },
        }));
        const res = await chai.request(app).delete('/admin/products/fizz');
        res.should.have.status(204);
    });

    it('should fail deleting non-existing product', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => null,
                }),
                deleteOne: () => {},
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        const res = await chai.request(app).delete('/admin/products/fizz');
        res.should.have.status(404);
    });

    it('should fail deleting product on error', async () => {
        const app = express();
        app.use(express.json());
        app.use('/admin/products', products({
            model: (name, schema) => ({
                findById: () => ({
                    exec: async () => {
                        throw new Error();
                    },
                }),
                deleteOne: () => {},
                schema,
            }),
            ProductSchema,
            router: express.Router(),
            queryOptionsCheck,
        }));
        app.use(errorHandler);
        const res = await chai.request(app).delete('/admin/products/fizz');
        res.should.have.status(500);
    });

});
