import { observer } from 'mobx-react';
import { PureComponent } from 'react';
//@ts-ignore
import ImageGallery from 'react-image-gallery';
import modals from '../../stores/Modals';

export interface GalleryModalProps {
	images: string[];
	close: () => void;
}

@observer
export default class GalleryModal extends PureComponent<GalleryModalProps> {
	static view(images: string[]) {
		let hide = () => {};
		modals.show((close: () => void) => {
			hide = close;
			return <GalleryModal close={close} images={images} />;
		});
		return { hide };
	}

	render() {
		return (
			<div
				style={{
					position: 'fixed',
					zIndex: 1000,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0,
					backdropFilter: 'blur(10px)',
					background: 'rgba(0, 0, 0, 0.8)',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={() => this.props.close()}
			>
				<div
					style={{
						position: 'fixed',
						right: 20,
						top: 10,
						cursor: 'pointer',
						fontSize: 30,
						color: 'white',
					}}
					onClick={() => {
						this.props.close();
					}}
				>
					x
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						textAlign: 'center',
					}}
					onClick={e => {
						e.stopPropagation();
					}}
				>
					<ImageGallery
						items={this.props.images.map(img => ({
							original: img,
							thumbnail: img,
						}))}
						showThumbnails={false}
						showNav={false}
						showFullscreenButton={false}
						showPlayButton={false}
					/>
				</div>
			</div>
		);
	}
}
