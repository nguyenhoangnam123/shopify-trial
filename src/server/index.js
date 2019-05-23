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

const app = express();
const https = require('https');

// const publicPath = path.resolve(__dirname, 'client');

const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET } = process.env;
const certOption = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/server.key')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/server.crt'))
};
const scopes = ['read_products', 'write_products'];
const shop = 'peguin21894.myshopify.com';
const forwardingAddress = 'https://localhost:443';
const prepareAuthRoute = 'https://localhost/shopify';

app.use(express.static('src/server/cert'));
app.use(express.static('dist/client'));

function base64Encoded(file) {
    const bitmap = fs.readFileSync(file);
    const attachment = bitmap.toString('base64');
    console.log('attachment: ', attachment);
    return attachment;
}

app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(
    session({
        secret: SHOPIFY_API_SECRET,
        resave: true,
        saveUninitialized: true
    })
);

app.get('/', (req, res) => {
    if (req.session.accessToken) {
        // console.log('returned access token', req.session.accessToken);
        const pathToIndex = path.resolve('dist/client/index.html');
        res.sendFile(pathToIndex);
    } else {
        const redirectUri = `${forwardingAddress}/shopify?shop=peguin21894.myshopify.com`;
        res.redirect(redirectUri);
    }
});

app.get('/api/getAllProduct', (req, res) => {
    if (req.session.accessToken) {
        const getAllProduct = {
            uri: `https://${shop}/admin/api/2019-04/products.json`,
            headers: {
                'X-Shopify-Access-Token': req.session.accessToken
            }
        };
        request(getAllProduct)
            // .then(data => console.log(data))
            .then(data => res.send(data))
            .catch(err => console.log(err));
    } else {
        res.redirect(prepareAuthRoute);
    }
});

app.get('/api/getProductById/:id', (req, res) => {
    if (req.session.accessToken) {
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
        res.redirect(prepareAuthRoute);
    }
});

app.post('/api/updateProduct', (req, res) => {
    const { id, title, body_html } = req.body;
    // console.log(req.body);
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
});

app.post('/api/:id/upLoadImage', (req, res) => {
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
});

app.get('/shopify', (req, res) => {
    const state = nonce();
    const redirectUri = `${forwardingAddress}/shopify/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&state=${state}&redirect_uri=${redirectUri}`;
    res.cookie('state', state);
    res.redirect(installUrl);
});

app.get('/shopify/callback', (req, res) => {
    const { hmac, code, state } = req.query;
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
                // console.log('session token', req.session.accessToken);
                const getAllProduct = {
                    uri: `https://${shop}/admin/api/2019-04/products.json`,
                    headers: {
                        'X-Shopify-Access-Token': accessToken
                    }
                };
                request(getAllProduct)
                    .then(data => res.send(data))
                    .catch(err => console.log(err));
                // res.send('successful');
            })
            .catch(err => console.log(err));
    } else {
        res.status(400).send('Required parameters missing');
    }
});

const server = https.createServer(certOption, app).listen(443);
