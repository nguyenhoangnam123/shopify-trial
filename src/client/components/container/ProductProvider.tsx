import { Container } from 'unstated';

interface IState {
    id: string;
    title: string;
    body_html: string;
    image: {
        id: string;
        src: string;
        alt: string;
    };
    images: Array<Object>;
    files: Array<File>;
    rejectedFiles: Array<File>;
    hasError: boolean;
    showToast: boolean;
    buttonFaded: boolean;
}

class ProductProvider extends Container<IState> {
    state = {
        id: '',
        title: '',
        body_html: '',
        image: {
            id: '',
            src: '',
            alt: ''
        },
        images: [],
        files: [],
        rejectedFiles: [],
        hasError: false,
        showToast: false,
        buttonFaded: false
    };

    handleToast = () => {
        this.setState(prevState => ({
            showToast: !prevState.showToast
        }));
    };

    setDisableButton = () => {
        this.setState({
            buttonFaded: true
        });
        console.log('disable button save: ', this.state.buttonFaded);
    };

    setActiveButton = () => {
        this.setState({
            buttonFaded: false
        });
    };

    handleChangeText = async (field: string, value: string) => {
        await this.setState(prevState => ({
            ...prevState,
            [field]: value
        }));
    };

    handleDropImage = async (files: Array<File>, rejectedFiles: Array<File>, hasError: boolean) => {
        await this.setState({
            files,
            rejectedFiles,
            hasError
        });
        // await console.log('updated files on Change: ', this.state);
    };

    uploadImage = async (files: Array<File>, id: string) => {
        if (files.length) {
            files.map((file: any) => {
                const filename = file.name;
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1].trim();
                    try {
                        const response = await fetch(`/api/${id}/upLoadImage`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            mode: 'cors',
                            body: JSON.stringify({
                                file: base64,
                                filename
                            })
                        });
                        const data = await response.json();
                    } catch (err) {
                        console.log(err);
                        Response.redirect('/', 401);
                    }
                };
            });
        } else {
            console.log('files are empty');
        }
    };

    getProductById = async (id: string) => {
        try {
            const response = await fetch(`/api/getProductById/${id}`, { mode: 'no-cors' });
            const { product } = await response.json();
            console.log('product=== > ', product);
            await this.setState({
                id: product.id,
                title: product.title,
                body_html: product.body_html,
                image: product.image,
                images: product.images
            });
        } catch (err) {
            console.log(err);
            Response.redirect('/', 401);
        }
    };
}

export default ProductProvider;
