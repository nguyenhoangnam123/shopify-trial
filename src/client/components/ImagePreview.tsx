import * as React from 'react';
import { Thumbnail, Card, Stack } from '@shopify/polaris';

interface IProps {
    imgSource: {
        id: string;
        src: string;
        alt: string;
    };
    images: Object[];
}
class ImagePreview extends React.Component<IProps> {
    render() {
        const images = this.props.images;
        const img = this.props.imgSource;
        if (images.length > 0) {
            const element = images.map((img: any) => {
                return <Thumbnail source={img.src} key={img.id} size="large" alt={img.alt} />;
            });
            return (
                <Card>
                    <Stack>{element}</Stack>
                </Card>
            );
        }
        return <Stack />;
    }
}

export default ImagePreview;
