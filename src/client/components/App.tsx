import * as React from 'react';
import { AppProvider, Page, Card, Layout, Thumbnail, ResourceList, Avatar, TextStyle } from '@shopify/polaris';
import { BrowserRouter as Route, Link } from 'react-router-dom';
import { Subscribe } from 'unstated';
import ProductProvider from './container/ProductProvider';

interface productItem {
    id: number;
    title: string;
    image: {
        src: string;
    };
}

class App extends React.Component {
    componentDidMount = async () => {
        try {
            const response = await fetch('/api/getAllProduct', { mode: 'no-cors' });
            const data = await response.json();
            this.setState({ items: data.products });
        } catch (err) {
            console.log(err);
        }
    };
    state = {
        items: []
    };

    private idRef = React.createRef<HTMLInputElement>();

    renderItem = (item: productItem) => {
        const { title } = item;
        const id = item.id.toString();
        const url = `/product/${id}`;
        let media = <Avatar customer name="Farrah" />;

        if (item.image) {
            media = <Thumbnail source={item.image.src} size="large" alt="Black choker necklace" />;
        }

        return (
            <Subscribe to={[ProductProvider]}>
                {(props: ProductProvider) => (
                    <ResourceList.Item id={id} url="#" media={media} accessibilityLabel={`View details for ${title}`}>
                        <input hidden defaultValue={id} ref={this.idRef} />
                        <Link to={url}>
                            <h3>
                                <TextStyle variation="strong">{title}</TextStyle>
                            </h3>
                        </Link>
                    </ResourceList.Item>
                )}
            </Subscribe>
        );
    };

    render() {
        const resourceName = {
            singular: 'customer',
            plural: 'customers'
        };
        const items = this.state.items;
        return (
            <Page title="All Products">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <ResourceList
                                resourceName={resourceName}
                                items={this.state.items}
                                renderItem={this.renderItem}
                            />
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        );
    }
}

export default App;
