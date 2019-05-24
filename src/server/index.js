const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv').config();
const express = require('express');
const session = require('express-session');
const nonce = require('nonce')();
const cookie = require('cookie');
const queryString = require('querystring');
const request = require('request-promise');
const crypto = require('crypto');
const bodyParser = require('body-parser');
// const helmet = require('helmet');

const app = express();
const https = require('https');

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;
const certOption = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/server.crt'))
};
const scopes = ['read_products', 'write_products'];
const forwardingAddress = 'https://localhost:443';

app.use(express.static('src/server/cert'));
app.use(express.static('dist'));
app.disable('x-powered-by');

app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(
    session({
        secret: SHOPIFY_API_SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
            maxAge: 120000,
            secure: true
        }
    })
);

app.get('/', (req, res) => {
    if (req.session.accessToken) {
        const pathToIndex = path.resolve('dist/client/index.html');
        res.sendFile(pathToIndex);
    } else {
        console.log('session is expired');
        const pathToIndex = path.resolve('dist/client/login.html');
        res.sendFile(pathToIndex);
    }
});

app.get('/getShop', (req, res) => {
    const { accessToken, shop } = req.session;
    if (accessToken && shop) {
        res.send(shop);
    } else {
        res.redirect('/');
    }
});

app.get('/api/getAllProduct', (req, res) => {
    const { accessToken, shop } = req.session;
    if (accessToken && shop) {
        const getAllProduct = {
            uri: `https://${shop}/admin/api/2019-04/products.json`,
            headers: {
                'X-Shopify-Access-Token': req.session.accessToken
            }
        };
        request(getAllProduct)
            .then(data => res.send(data))
            .catch(err => console.log(err));
    } else {
        res.status(401).redirect('/');
    }
});

app.get('/api/getProductById/:id', (req, res) => {
    const { accessToken, shop } = req.session;
    if (accessToken && shop) {
        const { id } = req.params;
        // console.log(id);
        const getAllProduct = {
            uri: `https://${shop}/admin/api/2019-04/products/${id}.json`,
            headers: {
                'X-Shopify-Access-Token': req.session.accessToken
            },
            method: 'GET'
        };
        request(getAllProduct)
            .then(data => res.send(data))
            .catch(err => console.log(err));
    } else {
        res.status(401).redirect('/');
    }
});

app.post('/api/updateProduct', (req, res) => {
    const { accessToken, shop } = req.session;
    if (accessToken && shop) {
        const { id, title, body_html } = req.body;
        const optionUpdate = {
            uri: `https://${shop}/admin/api/2019-04/products/1718028533831.json`,
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': req.session.accessToken
            },
            body: {
                product: {
                    id,
                    title,
                    body_html
                }
            },
            json: true
        };
        request(optionUpdate)
            .then(data => res.send(data))
            // .then(data => console.log(data))
            .catch(err => console.log(err));
    } else {
        res.status(401).redirect('/');
    }
});

app.post('/api/:id/upLoadImage', (req, res) => {
    const { accessToken, shop } = req.session;
    if (accessToken && shop) {
        const { file, filename } = req.body;
        const { id } = req.params;
        // console.log('request body: ', req.body);
        const optionCreateImage = {
            uri: `https://${shop}/admin/api/2019-04/products/${id}/images.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': req.session.accessToken
            },
            body: {
                image: {
                    attachment: file,
                    filename
                }
            },
            json: true
        };
        request(optionCreateImage)
            .then(data => res.send(data))
            .catch(err => console.log(err));
    } else {
        res.status(401).redirect('/');
    }
});

app.post('/shopify', (req, res) => {
    console.log('inside prepare redirect');
    const shopName = req.body.shop;
    const shop = `${shopName}.myshopify.com`;
    const state = nonce();
    const redirectUri = `${forwardingAddress}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;
    res.cookie('state', state);
    res.redirect(installUrl);
});

app.get('/shopify/callback', (req, res) => {
    const { shop, hmac, code, state } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;
    if (state !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }
    if (shop && hmac && code) {
        const map = Object.assign({}, req.query);
        delete map.signature;
        delete map.hmac;
        const message = queryString.stringify(map);
        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
            crypto
                .createHmac('sha256', SHOPIFY_API_SECRET)
                .update(message)
                .digest('hex'),
            'utf-8'
        );
        let hashEquals = false;
        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac);
        } catch (e) {
            hashEquals = false;
        }

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed');
        }

        const accessTokenRequestUrl = `https://${shop}/admin/oauth/access_token`;
        const accessTokenPayload = {
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code
        };
        request
            .post(accessTokenRequestUrl, { json: accessTokenPayload })
            .then(accessTokenResponse => {
                const accessToken = accessTokenResponse.access_token;
                req.session.accessToken = accessToken;
                req.session.shop = shop;
                res.redirect('/');
            })
            .catch(err => console.log(err));
    } else {
        res.status(400).send('Required parameters missing');
    }
});

const server = https.createServer(certOption, app).listen(443);
