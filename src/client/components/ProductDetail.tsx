import * as React from 'react';
import { Page, Card, Layout, Frame } from '@shopify/polaris';
import { Subscribe } from 'unstated';
import ProductProvider from './container/ProductProvider';
import FormProduct from './FormProduct';

interface IProps {
    match: {
        params: {
            id: string;
        };
    };
}

class ProductDetail extends React.Component<IProps> {
    render() {
        const productId = this.props.match.params.id;
        return (
            <Frame>
                <Page
                    title="Product detail"
                    breadcrumbs={[{ content: 'Products', url: '/products' }]}
                    pagination={{
                        hasPrevious: true,
                        hasNext: true
                    }}
                >
                    <Layout>
                        <Layout.Section>
                            <Subscribe to={[ProductProvider]}>
                                {(provider: ProductProvider) => {
                                    return <FormProduct {...provider} id={productId} />;
                                }}
                            </Subscribe>
                        </Layout.Section>
                    </Layout>
                </Page>
            </Frame>
        );
    }
}

export default ProductDetail;
