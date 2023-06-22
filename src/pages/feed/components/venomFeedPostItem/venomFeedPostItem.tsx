import { MessageAttachmentLinkV1 } from '@ylide/sdk';
import clsx from 'clsx';
import React, { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { DecodedVenomFeedPost, decodeVenomFeedPost, VenomFilterApi } from '../../../../api/venomFilterApi';
import { ActionButton, ActionButtonLook } from '../../../../components/ActionButton/ActionButton';
import { AdaptiveAddress } from '../../../../components/adaptiveAddress/adaptiveAddress';
import { Avatar } from '../../../../components/avatar/avatar';
import { GridRowBox } from '../../../../components/boxes/boxes';
import { ErrorMessage, ErrorMessageLook } from '../../../../components/errorMessage/errorMessage';
import { NlToBr } from '../../../../components/nlToBr/nlToBr';
import { ReadableDate } from '../../../../components/readableDate/readableDate';
import { Recipients } from '../../../../components/recipientInput/recipientInput';
import { Spinner, SpinnerLook } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as CrossSvg } from '../../../../icons/ic20/cross.svg';
import { ReactComponent as ExternalSvg } from '../../../../icons/ic20/external.svg';
import { ReactComponent as MailSvg } from '../../../../icons/ic20/mail.svg';
import { MessageDecodedTextDataType } from '../../../../indexedDB/IndexedDB';
import { browserStorage } from '../../../../stores/browserStorage';
import { useVenomAccounts } from '../../../../stores/Domain';
import { OutgoingMailData } from '../../../../stores/outgoingMailData';
import { copyToClipboard } from '../../../../utils/clipboard';
import { ipfsToHttpUrl } from '../../../../utils/ipfs';
import { useOpenMailCompose } from '../../../../utils/mail';
import { useShiftPressed } from '../../../../utils/useShiftPressed';
import { PostItemContainer } from '../postItemContainer/postItemContainer';
import css from './venomFeedPostItem.module.scss';

interface VenomFeedPostItemViewProps {
	post: DecodedVenomFeedPost;

	isCompact?: boolean;
	isBanned?: boolean;
	isApproved?: boolean;
	isAdminHelpVisible?: boolean;
	loadReplyIfNeeded?: boolean;

	onClick?: MouseEventHandler<HTMLElement>;
	onAddressClick?: MouseEventHandler<HTMLElement>;
	onComposeClick?: MouseEventHandler<HTMLElement>;
	onReplyClick?: MouseEventHandler<HTMLElement>;
	onBanClick?: MouseEventHandler<HTMLElement>;
	onUnbanClick?: MouseEventHandler<HTMLElement>;
}

export function VenomFeedPostItemView({
	post,

	isCompact,
	isBanned,
	isApproved,
	isAdminHelpVisible,
	loadReplyIfNeeded,

	onClick,
	onAddressClick,
	onComposeClick,
	onReplyClick,
	onBanClick,
	onUnbanClick,
}: VenomFeedPostItemViewProps) {
	const decodedTextData = post.decoded.decodedTextData;
	const decodedText = useMemo(
		() =>
			decodedTextData.type === MessageDecodedTextDataType.PLAIN
				? decodedTextData.value
				: decodedTextData.value.toPlainText(),
		[decodedTextData],
	);

	const replyToId = useMemo(() => {
		if (loadReplyIfNeeded && decodedTextData.type === MessageDecodedTextDataType.YMF) {
			const firstChild = decodedTextData.value.root.children[0];

			if (firstChild?.type === 'tag' && firstChild.tag === 'reply-to') {
				return firstChild.attributes.id || undefined;
			}
		}
	}, [decodedTextData, loadReplyIfNeeded]);

	const repliedPostQuery = useQuery(['feed', 'venom', 'reply-to', replyToId], {
		enabled: !!replyToId,
		queryFn: async () => {
			const post = await VenomFilterApi.getPost({ id: replyToId! });
			return post ? decodeVenomFeedPost(post) : undefined;
		},
	});

	const attachment = post.decoded.attachments[0] as MessageAttachmentLinkV1 | undefined;
	const attachmentHttpUrl = attachment && ipfsToHttpUrl(attachment.link);

	return (
		<PostItemContainer
			isCollapsable
			isCompact={isCompact}
			className={clsx(css.root, isCompact && css.root_compact)}
			onClick={onClick}
		>
			<Avatar className={css.ava} blockie={post.msg.senderAddress} />

			<div className={css.meta}>
				<GridRowBox gap={2}>
					<AdaptiveAddress
						className={css.sender}
						maxLength={12}
						address={post.msg.senderAddress}
						onClick={onAddressClick}
					/>

					{onComposeClick && (
						<ActionButton
							className={css.composeButton}
							look={ActionButtonLook.LITE}
							icon={<MailSvg />}
							title="Compose mail"
							onClick={onComposeClick}
						/>
					)}
				</GridRowBox>

				<div className={css.metaRight}>
					<ReadableDate className={css.metaAction} value={post.msg.createdAt * 1000} />

					{onReplyClick && (
						<button className={clsx(css.metaAction, css.metaAction_interactive)} onClick={onReplyClick}>
							Reply
						</button>
					)}

					{!!post.msg.$$meta.id && (
						<a
							className={clsx(css.metaAction, css.metaAction_icon, css.metaAction_interactive)}
							href={`https://testnet.venomscan.com/messages/${post.msg.$$meta.id}`}
							target="_blank"
							rel="noreferrer"
							title="Details"
						>
							<ExternalSvg />
						</a>
					)}

					{onBanClick && (
						<button
							className={clsx(css.metaAction, css.metaAction_icon, css.metaAction_interactive)}
							onClick={onBanClick}
						>
							<CrossSvg />
						</button>
					)}
				</div>
			</div>

			<div className={css.body}>
				{isBanned ? (
					<ErrorMessage look={ErrorMessageLook.INFO}>
						Post banned 🔥
						<ActionButton onClick={onUnbanClick}>Undo</ActionButton>
					</ErrorMessage>
				) : isApproved ? (
					<ErrorMessage look={ErrorMessageLook.INFO}>Post approved 🔥</ErrorMessage>
				) : (
					<>
						{replyToId && (
							<>
								{repliedPostQuery.data ? (
									<VenomFeedPostItemView
										post={repliedPostQuery.data}
										isCompact
										onAddressClick={() => {
											copyToClipboard(post.msg.senderAddress, { toast: true });
										}}
									/>
								) : repliedPostQuery.isLoading ? (
									<GridRowBox>
										<Spinner look={SpinnerLook.SECONDARY} />
										Loading original post ...
									</GridRowBox>
								) : (
									"Couldn't load original post"
								)}
							</>
						)}

						<div className={css.text}>
							<NlToBr text={decodedText} />
						</div>

						{isAdminHelpVisible && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									marginTop: 10,
								}}
							>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										margin: 20,
										color: 'red',
									}}
								>
									<div style={{ fontSize: 100, marginBottom: 10 }}>←</div>
									<div>Shift + Left arrow to ban post</div>
								</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										margin: 20,
										color: 'green',
									}}
								>
									<div style={{ fontSize: 100, marginBottom: 10 }}>→</div>
									<div>Shift + Right arrow to approve post</div>
								</div>
							</div>
						)}

						{attachmentHttpUrl && <img className={css.cover} alt="Attachment" src={attachmentHttpUrl} />}
					</>
				)}
			</div>
		</PostItemContainer>
	);
}

//

interface VenomFeedPostItemProps {
	post: DecodedVenomFeedPost;
	isFirstPost: boolean;
	onNextPost: () => void;
	onReplyClick: () => void;
}

export function VenomFeedPostItem({ post, isFirstPost, onNextPost, onReplyClick }: VenomFeedPostItemProps) {
	let [clicks] = useState<number[]>([]);

	const [isBanned, setBanned] = useState(false);
	const [isApproved, setApproved] = useState(false);
	const isShiftPressed = useShiftPressed();

	const openMailCompose = useOpenMailCompose();
	const venomAccounts = useVenomAccounts();

	const banAddress = useCallback(() => {
		VenomFilterApi.banAddresses({
			addresses: [post.msg.senderAddress],
			secret: browserStorage.userAdminPassword || '',
		})
			.then(() => {
				toast('Banned 🔥');
				setBanned(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	}, [post.msg.senderAddress]);

	const banPost = useCallback(() => {
		VenomFilterApi.banPost({ ids: [post.msg.msgId], secret: browserStorage.userAdminPassword || '' })
			.then(() => {
				toast('Banned 🔥');
				setBanned(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	}, [post.msg.msgId]);

	const approvePost = useCallback(() => {
		VenomFilterApi.approvePost({ ids: [post.msg.msgId], secret: browserStorage.userAdminPassword || '' })
			.then(() => {
				toast('Approved 🔥');
				setApproved(true);
			})
			.catch(e => {
				if (e.message === 'Request failed') {
					toast('Wrong password 🤦‍♀️');
				} else {
					toast('Error 🤦‍♀️');
					throw e;
				}
			});
	}, [post.msg.msgId]);

	const unbanPost = useCallback(() => {
		VenomFilterApi.unbanPost({ ids: [post.msg.msgId], secret: browserStorage.userAdminPassword || '' })
			.then(() => {
				toast('Un-banned 🔥');
				setBanned(false);
			})
			.catch(e => {
				toast('Error 🤦‍♀️');
				throw e;
			});
	}, [post.msg.msgId]);

	useEffect(() => {
		if (isFirstPost && browserStorage.isUserAdmin) {
			const downHandler = (e: KeyboardEvent) => {
				// shift + left arrow:
				if (e.shiftKey && e.keyCode === 37) {
					banPost();
					onNextPost();
				}
				// shift + right arrow:
				if (e.shiftKey && e.keyCode === 39) {
					approvePost();
					onNextPost();
				}
			};
			window.addEventListener('keydown', downHandler);
			return () => {
				window.removeEventListener('keydown', downHandler);
			};
		}
	}, [banPost, isFirstPost, approvePost, onNextPost]);

	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isFirstPost && isShiftPressed && browserStorage.isUserAdmin) {
			scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
			}, 100);
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
			}, 200);
		}
	}, [isFirstPost, isShiftPressed]);

	return (
		<div style={{ position: 'relative' }}>
			<div ref={scrollRef} style={{ position: 'absolute', top: -100 }} />

			<VenomFeedPostItemView
				post={post}
				isBanned={isBanned}
				isApproved={isApproved}
				isAdminHelpVisible={browserStorage.isUserAdmin && isFirstPost && isShiftPressed}
				loadReplyIfNeeded
				onClick={() => {
					clicks = [Date.now(), ...clicks].slice(0, 3);
					if (browserStorage.isUserAdmin && clicks.length === 3 && clicks[0] - clicks[2] < 600) {
						banPost();
					}
				}}
				onAddressClick={e => {
					if (e.shiftKey && browserStorage.isUserAdmin) {
						banAddress();
					} else {
						copyToClipboard(post.msg.senderAddress, { toast: true });
					}
				}}
				onComposeClick={() => {
					const mailData = new OutgoingMailData();
					mailData.from = venomAccounts[0];
					mailData.to = new Recipients([post.msg.senderAddress]);

					openMailCompose({ mailData });
				}}
				onReplyClick={onReplyClick}
				onBanClick={browserStorage.isUserAdmin ? () => banPost() : undefined}
				onUnbanClick={() => unbanPost()}
			/>
		</div>
	);
}
