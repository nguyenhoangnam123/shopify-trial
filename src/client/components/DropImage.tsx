import * as React from 'react';
import { Stack, DropZone, Thumbnail, Caption, Banner, List } from '@shopify/polaris';

interface IProps {
    state: {
        id: string;
        files: Array<File>;
        rejectedFiles: Array<any>;
        hasError: boolean;
    };
    getProductById: (a: string) => void;
    uploadImage: (files: Array<File>, id: string) => void;
    handleDropImage: (files: Array<File>, rejectedFiles: Array<File>, hasError: boolean) => void;
}
class DropImage extends React.Component<IProps> {
    state = {
        files: [],
        rejectedFiles: [],
        hasError: false
    };

    handleDrop = async (acceptedFiles: Array<File>, rejectedFiles: Array<File>) => {
        let error = await this.props.state.hasError;
        // handle image upload
        if (rejectedFiles.length > 0) {
            error = true;
        }

        await this.props.handleDropImage(acceptedFiles, rejectedFiles, error);
        const id = await this.props.state.id;
        const files = await this.props.state.files;

        // await console.log('files after updated: ', files);

        await this.props.uploadImage(files, id);

        await setTimeout(() => this.props.getProductById(id), 2000);
        // await this.props.getProductById(id);
    };

    render() {
        const { files, hasError, rejectedFiles } = this.props.state;

        const fileUpload = !files.length && <DropZone.FileUpload />;
        const uploadedFiles = files.length > 0 && (
            <Stack vertical>
                {files.map((file: any, index: any) => (
                    <Stack alignment="center" key={index}>
                        <Thumbnail size="small" alt={file.name} source={window.URL.createObjectURL(file)} />
                        <div>
                            {file.name} <Caption>{file.size} bytes</Caption>
                        </div>
                    </Stack>
                ))}
            </Stack>
        );
        const errorMessage = hasError && (
            <Banner title="The following images couldn’t be uploaded:" status="critical">
                <List type="bullet">
                    {rejectedFiles.map((file: any, index: any) => (
                        <List.Item key={index}>
                            {`"${file.name}" is not supported. File type must be .gif, .jpg, .png or .svg.`}
                        </List.Item>
                    ))}
                </List>
            </Banner>
        );
        return (
            <Stack vertical>
                {errorMessage}
                <DropZone
                    accept="image/*"
                    type="image"
                    onDrop={async (files, acceptedFiles, rejectedFiles) =>
                        this.handleDrop(acceptedFiles, rejectedFiles)
                    }
                >
                    {uploadedFiles}
                    {fileUpload}
                </DropZone>
            </Stack>
        );
    }
}

export default DropImage;
