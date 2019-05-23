import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './components/App';
import ProductDetail from './components/ProductDetail';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import { Provider } from 'unstated';

const apiKey = '0d8f0b43f5e16e204f06f4cfafaf0f2d';
const shopOrigin = 'peguin21894.myshopify.com';

ReactDOM.render(
    <AppProvider apiKey={apiKey} shopOrigin={shopOrigin}>
        <Router>
            <Switch>
                <Provider>
                    <Route exact path="/" component={App} />
                    <Route path="/product/:id" component={ProductDetail} />
                </Provider>
            </Switch>
        </Router>
    </AppProvider>,
    document.getElementById('root') as HTMLElement
);
