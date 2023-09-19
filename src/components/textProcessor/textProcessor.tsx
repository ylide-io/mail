import { ReactNode, useMemo, useState } from 'react';

import { APP_NAME } from '../../constants';
import { transformMatches, truncateInMiddle } from '../../utils/string';
import { isExternalUrl } from '../../utils/url';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../ActionButton/ActionButton';
import { ActionModal } from '../actionModal/actionModal';

interface UnsafeAnchorProps {
	url: string;
}

export function UnsafeAnchor({ url }: UnsafeAnchorProps) {
	const [blurred, setBlurred] = useState(true);
	const [popupOpen, setPopupOpen] = useState(false);

	return (
		<>
			<a
				style={{
					filter: blurred ? 'blur(5px)' : undefined,
				}}
				onClick={() => {
					if (blurred) {
						setBlurred(false);
					} else {
						setPopupOpen(true);
					}
				}}
			>
				{url}
			</a>

			{popupOpen && (
				<ActionModal
					title="External Link Warning"
					buttons={
						<>
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.DANGEROUS}
								href={url}
								onClick={() => setPopupOpen(false)}
							>
								Proceed
							</ActionButton>
							<ActionButton
								size={ActionButtonSize.XLARGE}
								look={ActionButtonLook.LITE}
								onClick={() => setPopupOpen(false)}
							>
								Cancel
							</ActionButton>
						</>
					}
					onClose={() => setPopupOpen(false)}
				>
					<div>
						You're about to open an external website that has no relation to {APP_NAME}. Please be very
						careful about using your crypto wallet, signatures and transactions on any external websites you
						do not trust.
					</div>

					<b>{truncateInMiddle(url, 256, '<...>')}</b>

					<div>
						If you trust the source, you can proceed to this website, or click 'Cancel' to return to where
						you were before.
					</div>
				</ActionModal>
			)}
		</>
	);
}

interface TextProcessorProps {
	text: string;
	nlToBr?: boolean;
	linksToAnchors?: boolean;
	unsafeLinks?: boolean;
}

export function TextProcessor({ text, nlToBr, linksToAnchors, unsafeLinks }: TextProcessorProps) {
	const pieces = useMemo(() => {
		let pieces: ReactNode[] = [text];

		if (nlToBr) {
			pieces = text.split('\n').reduce<ReactNode[]>((res, curr, i) => {
				if (res.length) {
					res.push(<br key={`nlToBr ${i}`} />);
				}

				res.push(curr);

				return res;
			}, []);
		}

		if (linksToAnchors) {
			pieces = pieces.reduce<ReactNode[]>((res, curr, i) => {
				if (typeof curr === 'string') {
					res.push(
						// https://regexr.com/7kc9g
						...transformMatches(curr, /((https?:\/\/)\S{3,1024})/gi, (item, j) =>
							unsafeLinks && isExternalUrl(item) ? (
								<UnsafeAnchor key={`linksToAnchors ${i} ${j}`} url={item} />
							) : (
								<a key={`linksToAnchors ${i} ${j}`} href={item} target="_blank" rel="noreferrer">
									{item}
								</a>
							),
						),
					);
				} else {
					res.push(curr);
				}

				return res;
			}, []);
		}

		return pieces;
	}, [unsafeLinks, linksToAnchors, nlToBr, text]);

	return <>{pieces}</>;
}
