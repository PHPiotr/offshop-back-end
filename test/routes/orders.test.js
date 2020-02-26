const express = require('express');
const {Schema} = require('mongoose');
const slugify = require('slugify');
const chai = require('chai');
const chaiHttp = require('chai-http');
const uniqueValidator = require('mongoose-unique-validator');
const orders = require('../../routes/orders');
const errorHandler = require('../../routes/errorHandler')(false);

const {possibleOrderStatuses, statusesDescriptions} = require('../../utils/getPossibleOrderStatuses');
const sendMail = require('../../utils/sendMail');

const DeliveryMethodSchema = require('../../schemas/DeliveryMethodSchema')({Schema, slugify});
const OrderSchema = require('../../schemas/OrderSchema')({Schema, possibleOrderStatuses});
const ProductSchema = require('../../schemas/ProductSchema')({Schema, slugify, uniqueValidator});

const accessTokenCheck = require('../../middleware/accessTokenCheck');
const verifyNotificationSignature = require('../../middleware/verifyNotificationSignature');
const productsCheckMiddleware = require('../../middleware/productsCheck');
const deliveryMethodCheckMiddleware = require('../../middleware/deliveryMethodCheck');
const currentTime = (new Date()).getTime();
const setCreateOrderRequestConfig = require('../../middleware/setCreateOrderRequestConfig')({
    createOrderUrl: 'https://some-api.com/orders',
    notifyUrl: 'https://some-api.com/notify',
    getObjectId: () => `${currentTime}`,
});

chai.use(chaiHttp);
chai.should();

describe('orders', () => {

    describe('create', () => {

        const defaultData = {
            continueUrl: 'https://continue.example.com',
            notifyUrl: 'https://notify.example.com',
            merchantPosId: 'foo',
            description: 'bar',
            currencyCode: 'PLN',
            totalAmount: 1000,
            totalWithoutDelivery: 1000,
            buyer: {},
            settings: {},
            productsIds: ['foo'],
            productsById: {
                foo: {unitPrice: 1000, quantity: 1, name: 'foo', weight: 100, active: true},
            },
            payMethods: {},
            totalWeight: 100,
            deliveryMethod: {id: 'fizz', active: true, unitPrice: 0, name: 'Fizz', slug: 'fizz'},
        };

        const defaultProduct = {unitPrice: 1000, stock: 2, name: 'foo', weight: 100, active: true};
        const defaultDelivery = {active: true, unitPrice: 0, name: 'Fizz', slug: 'fizz'};

        [
            [
                'should succeed',
                () => ({data: {orderId: `${currentTime}`, redirectUri: 'https://example.com/redirect'}}),
                defaultProduct,
                defaultDelivery,
                () => ({exec: () => ({status: 'FOO_BAR_BAZ', orderId: `${currentTime}`})}),
                'authorization',
                'Bearer foo.bar.baz',
                defaultData,
                200,
            ],
            [
                'should fail if axios error',
                () => {throw new Error('Foo');},
                defaultProduct,
                defaultDelivery,
                () => ({exec: () => ({status: 'FOO_BAR_BAZ', orderId: `${currentTime}`})}),
                'authorization',
                'Bearer foo.bar.baz',
                defaultData,
                500,
            ],
            [
                'should fail if unable to insert order record',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => {throw new Error('Foo');},
                'authorization',
                'Bearer foo.bar.baz',
                defaultData,
                500,
            ],
            [
                'should fail if unable to update order record',
                () => null,
                defaultProduct,
                defaultDelivery,
                (filter, doc, options) => {
                    if (options.upsert) {
                        return {
                            exec: () => (
                                {
                                    status: 'FOO_BAR_BAZ',
                                    orderId: `${currentTime}`,
                                }
                            ),
                        }
                    }
                    throw new Error('Foo');
                },
                'authorization',
                'Bearer foo.bar.baz',
                defaultData,
                500,
            ],
            [
                'should accept only 201 and 302 statuses when axios validates status',
                ({validateStatus}) => {
                    validateStatus(200).should.be.eql(false);
                    validateStatus(201).should.be.eql(true);
                    validateStatus(302).should.be.eql(true);
                    validateStatus(404).should.be.eql(false);
                    validateStatus(500).should.be.eql(false);
                    return {data: {orderId: `${currentTime}`, redirectUri: 'https://example.com/redirect'}};
                },
                defaultProduct,
                defaultDelivery,
                () => ({exec: () => ({status: 'FOO_BAR_BAZ', orderId: `${currentTime}`})}),
                'authorization',
                'Bearer foo.bar.baz',
                defaultData,
                200,
            ],
            [
                'should fail if no authorization header',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'x-authorization',
                'foo.bar.baz',
                defaultData,
                401,
            ],
            [
                'should fail if no value for authorization header',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                '',
                defaultData,
                401,
            ],
            [
                'should fail if empty products ids array',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsIds: []},
                400,
            ],
            [
                'should fail if total weight is not a number',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, totalWeight: 'foo'},
                400,
            ],
            [
                'should fail if product data missing',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsById: {...defaultData.productsById, [defaultData.productsIds[0]]: null}},
                400,
            ],
            [
                'should fail product unit price does not match',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsById: {...defaultData.productsById, [defaultData.productsIds[0]]: {...defaultData.productsById[defaultData.productsIds[0]], unitPrice: 99999}}},
                400,
            ],
            [
                'should fail if product quantity passed exceeds amount in stock',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsById: {...defaultData.productsById, foo: {...defaultData.productsById[defaultData.productsIds[0]], quantity: 3}}},
                400,
            ],
            [
                'should fail if product name does not match',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsById: {...defaultData.productsById, foo: {...defaultData.productsById[defaultData.productsIds[0]], name: 'bar'}}},
                400,
            ],
            [
                'should fail if product is inactive',
                () => null,
                {...defaultProduct, active: false},
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if product weight does not match',
                () => null,
                {...defaultProduct, weight: defaultProduct.weight + 1},
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if total cost without delivery does not match',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, totalWithoutDelivery: defaultData.totalWithoutDelivery + 1},
                400,
            ],
            [
                'should fail if no products data passed',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, productsById: undefined, productsIds: undefined},
                400,
            ],
            [
                'should fail if no delivery method data passed',
                () => null,
                defaultProduct,
                defaultDelivery,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                {...defaultData, deliveryMethod: undefined},
                400,
            ],
            [
                'should fail if no delivery method does not exist',
                () => null,
                defaultProduct,
                {...defaultDelivery, active: false},
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if no delivery method not active',
                () => null,
                defaultProduct,
                null,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if price of delivery method does not match',
                () => null,
                defaultProduct,
                {...defaultDelivery, unitPrice: defaultDelivery.unitPrice + 1},
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if name of delivery method does not match',
                () => null,
                defaultProduct,
                {...defaultDelivery, name: `${defaultDelivery.name}fizz`},
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if slug of delivery method does not match',
                () => null,
                defaultProduct,
                {...defaultDelivery, slug: `${defaultDelivery.slug}fizz`},
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
            [
                'should fail if error thrown',
                () => null,
                defaultProduct,
                Error,
                () => null,
                'authorization',
                'bearer foo.bar.baz',
                defaultData,
                400,
            ],
        ].forEach(([should, axios, product, delivery, findOneAndUpdate, auth, token, data, status]) => {

            it(should, async () => {

                const app = express();
                app.use(express.json());
                app.use('/orders', orders({
                    io: {
                        to: () => ({emit: () => null}),
                        emit: () => this,
                    },
                    router: express.Router(),
                    model: name => ({
                        findById: () => {
                            if (name === 'Product') {
                                return product;
                            }
                            if (name === 'Delivery') {
                                if (typeof delivery === 'object') {
                                    return delivery;
                                }
                                if (typeof delivery === 'function') {
                                    throw new delivery();
                                }
                            }
                        },
                        findOneAndUpdate,
                    }),
                    OrderSchema,
                    ProductSchema,
                    DeliveryMethodSchema,
                    accessTokenCheck,
                    verifyNotificationSignature,
                    productsCheckMiddleware,
                    deliveryMethodCheckMiddleware,
                    setCreateOrderRequestConfig,
                    sendMail,
                    emailFrom: 'foo@example.com',
                    axios,
                    statusesDescriptions,
                    productPath: 'https://some-api.com/products',
                }));
                app.use(errorHandler);
                const res = await chai.request(app).post('/orders').set(auth, token).send(data);
                res.should.have.status(status);
            });
        });

    });

});
