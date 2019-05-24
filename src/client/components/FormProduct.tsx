import * as React from 'react';
import { Form, FormLayout, Button, TextField, Card, Layout, Toast } from '@shopify/polaris';
import DropImage from './DropImage';
import ImagePreview from './ImagePreview';

interface IProps {
    state: {
        id: string;
        title: string;
        body_html: string;
        images: Array<Object>;
        image: {
            id: string;
            src: string;
            alt: string;
        };
        files: Array<File>;
        rejectedFiles: Array<any>;
        hasError: boolean;
        showToast: boolean;
        buttonFaded: boolean;
    };
    handleChangeText: (field: string, value: string) => void;
    getProductById: (a: string) => void;
    id: string;
    uploadImage: (files: Array<File>, id: string) => void;
    handleDropImage: (files: Array<File>, rejectedFiles: Array<File>, hasError: boolean) => void;
    handleToast: () => void;
    setDisableButton: () => void;
    setActiveButton: () => void;
}

class FormProduct extends React.Component<IProps> {
    componentDidMount = async () => {
        await this.props.getProductById(this.props.id);
    };

    toggleToast = () => {
        this.props.handleToast();
    };

    handleChange = (field: string) => {
        return (value: string) => {
            this.props.setActiveButton();
            this.props.handleChangeText(field, value);
        };
    };

    handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.persist();
        const { id, title, body_html } = await this.props.state;
        e.preventDefault();
        try {
            const response = await fetch('/api/updateProduct', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    title,
                    body_html
                })
            });
            const data = await response.json();
        } catch (err) {
            console.log(err);
            Response.redirect('/', 401);
        }
        await this.toggleToast();
        await this.props.setDisableButton();
    };

    render() {
        const { title, body_html, image, images, showToast, buttonFaded } = this.props.state;
        const toastMarkup = showToast ? <Toast content="Save changed" onDismiss={this.toggleToast} /> : null;
        return (
            <Form onSubmit={this.handleSubmit}>
                <FormLayout>
                    <Card title="Edit Product" sectioned>
                        <TextField
                            label="Title"
                            name="title"
                            value={title}
                            onChange={this.handleChange('title')}
                            type="text"
                        />
                        <TextField
                            label="Description"
                            name="description"
                            onChange={this.handleChange('description')}
                            value={body_html}
                            type="text"
                        />
                    </Card>
                    <Layout>
                        <Layout.Section>
                            <ImagePreview imgSource={image} images={images} />
                            <Card>
                                <DropImage {...this.props} />
                            </Card>
                        </Layout.Section>
                        <Layout.Section secondary>
                            <Button submit primary disabled={buttonFaded}>
                                Save
                            </Button>
                            {toastMarkup}
                        </Layout.Section>
                    </Layout>
                </FormLayout>
            </Form>
        );
    }
}

export default FormProduct;
