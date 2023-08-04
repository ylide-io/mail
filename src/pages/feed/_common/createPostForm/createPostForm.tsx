import { EVMNetwork } from '@ylide/ethereum';
import { MessageAttachmentLinkV1, MessageAttachmentType } from '@ylide/sdk';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { forwardRef, Ref, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { BlockchainFeedApi, DecodedBlockchainFeedPost } from '../../../../api/blockchainFeedApi';
import { AccountSelect } from '../../../../components/accountSelect/accountSelect';
import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import { AutoSizeTextArea, AutoSizeTextAreaApi } from '../../../../components/autoSizeTextArea/autoSizeTextArea';
import { AnchoredPopup } from '../../../../components/popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../../../../components/props';
import { Spinner } from '../../../../components/spinner/spinner';
import { toast } from '../../../../components/toast/toast';
import { ReactComponent as TrashSvg } from '../../../../icons/ic20/trash.svg';
import { ReactComponent as ImageSvg } from '../../../../icons/ic28/image.svg';
import { ReactComponent as StickerSvg } from '../../../../icons/ic28/sticker.svg';
import { analytics } from '../../../../stores/Analytics';
import { BlockchainProjectMeta } from '../../../../stores/blockchainProjects/blockchainProjects';
import { DomainAccount } from '../../../../stores/models/DomainAccount';
import { OutgoingMailData, OutgoingMailDataMode } from '../../../../stores/outgoingMailData';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { calcComissions } from '../../../../utils/calcComissions';
import { openFilePicker, readFileAsDataURL } from '../../../../utils/file';
import { hashToIpfsUrl, ipfsToHttpUrl } from '../../../../utils/ipfs';
import { escapeRegex } from '../../../../utils/regex';
import { SendMailButton } from '../../../mail/_common/composeMailForm/sendMailButton/sendMailButton';
import { BlockchainProjectPostView } from '../blockchainProjectPost/blockchainProjectPost';
import css from './createPostForm.module.scss';
import { stickerIpfsIds } from './stickerIpfsIds';
import domain from '../../../../stores/Domain';

export interface CreatePostFormApi {
	replyTo: (post: DecodedBlockchainFeedPost) => void;
}

export interface CreatePostFormProps extends PropsWithClassName {
	accounts: DomainAccount[];
	isUnavailable: boolean;
	projectMeta: BlockchainProjectMeta;
	allowCustomAttachments: boolean;
	fixedEvmNetwork?: EVMNetwork;
	onCreated?: () => void;
}

export const CreatePostForm = observer(
	forwardRef(
		(
			{
				className,
				accounts,
				isUnavailable,
				projectMeta,
				allowCustomAttachments,
				fixedEvmNetwork,
				onCreated,
			}: CreatePostFormProps,
			ref: Ref<CreatePostFormApi>,
		) => {
			const textAreaApiRef = useRef<AutoSizeTextAreaApi>(null);

			const [replyTo, setReplyTo] = useState<DecodedBlockchainFeedPost>();

			const mailData = useMemo(() => {
				const mailData = new OutgoingMailData();

				mailData.mode = OutgoingMailDataMode.BROADCAST;
				mailData.isGenericFeed = true;
				mailData.extraPayment = '0';

				return mailData;
			}, []);

			useEffect(() => {
				mailData.feedId = projectMeta.feedId;

				if (fixedEvmNetwork != null) {
					mailData.network = fixedEvmNetwork;
				}

				mailData.validator = () => {
					const text = mailData.plainTextData;

					if (text.length > 4096) {
						toast('Text is too long 👀');
						return false;
					}

					if (text.split('\n').length > 128) {
						toast('Too many line breaks 👀');
						return false;
					}

					if (new RegExp('\\b(' + stopWords.map(escapeRegex).join('|') + ')\\b', 'i').test(text)) {
						toast(
							<>
								<b>Whoops, no inappropriate stuff allowed.</b>
								<div>
									Your message didn't go through because it contains inappropriate content. Let's keep
									it chill and respectful.
								</div>
							</>,
						);
						return false;
					}

					analytics.blockchainFeedSendAttempt(projectMeta.id, !!replyTo, replyTo?.original.id);

					return true;
				};
			}, [fixedEvmNetwork, mailData, projectMeta, replyTo]);

			useEffect(() => {
				mailData.from = mailData.from && accounts.includes(mailData.from) ? mailData.from : accounts[0];
			}, [mailData, accounts]);

			useEffect(() => {
				let cancelled = false;
				BlockchainFeedApi.getComissions({ feedId: mailData.feedId })
					.then(comissions => {
						if (cancelled || !mailData.from) {
							return;
						}
						const blockchain = domain.getBlockchainName(mailData.network);
						const comission = calcComissions(blockchain, comissions);
						mailData.extraPayment = comission || '0';
					})
					.catch(err => {
						console.error(err);
					});
				return () => {
					cancelled = true;
				};
			}, [mailData, mailData.from, mailData.network]);

			const [expanded, setExpanded] = useState(false);

			const stickerButtonRef = useRef(null);
			const [isStickerPopupOpen, setStickerPopupOpen] = useState(false);

			const [previewSrc, setPreviewSrc] = useState('');
			const [isPreviewLoading, setPreviewLoading] = useState(false);

			const attachFile = async () => {
				const files = await openFilePicker({ accept: 'image/png, image/jpeg' });
				const file = files[0];
				if (file) {
					setPreviewSrc('');
					setPreviewLoading(true);

					function success(src: string) {
						setPreviewSrc(src);
						setPreviewLoading(false);
						mailData.attachmentFiles = [file];
					}

					function error() {
						setPreviewLoading(false);
						toast("Couldn't load the image 😒");
					}

					try {
						const src = await readFileAsDataURL(file);
						const img = document.createElement('img');
						img.onload = () => success(src);
						img.onerror = error;
						img.src = src;
					} catch (e) {
						error();
					}
				}
			};

			const attachSticker = (id: string) => {
				const url = hashToIpfsUrl(id);

				mailData.attachments = [
					new MessageAttachmentLinkV1({
						type: MessageAttachmentType.LINK_V1,
						previewLink: '',
						link: url,
						fileName: 'Venom sticker',
						fileSize: 0,
						isEncrypted: false,
					}),
				];

				setStickerPopupOpen(false);
				setPreviewSrc(ipfsToHttpUrl(url));
			};

			const removeAttachment = () => {
				mailData.attachments = [];
				mailData.attachmentFiles = [];

				setPreviewSrc('');
			};

			const onSent = () => {
				analytics.blockchainFeedSendSuccessful(projectMeta.id, !!replyTo, replyTo?.original.id);

				mailData.plainTextData = '';
				mailData.attachments = [];
				mailData.attachmentFiles = [];

				setReplyTo(undefined);
				setExpanded(false);
				setPreviewSrc('');

				onCreated?.();
			};

			useEffect(() => {
				mailData.processContent = ymf => {
					if (replyTo) {
						ymf.root.children.unshift({
							parent: ymf.root,
							type: 'tag',
							tag: 'reply-to',
							attributes: {
								id: replyTo.original.id,
							},
							singular: true,
							children: [],
						});
					}

					return ymf;
				};
			}, [mailData, replyTo]);

			useImperativeHandle(
				ref,
				() => ({
					replyTo: post => {
						setExpanded(true);
						setReplyTo(post);
						textAreaApiRef.current?.focus();
					},
				}),
				[],
			);

			return (
				<div className={clsx(css.form, expanded && css.form_expanded, className)}>
					{replyTo && (
						<>
							<div className={css.replyToHeader}>
								<div className={css.replyToTitle}>Reply to:</div>

								<ActionButton look={ActionButtonLook.DANGEROUS} onClick={() => setReplyTo(undefined)}>
									Cancel
								</ActionButton>
							</div>

							<BlockchainProjectPostView post={replyTo} isCompact />

							<div className={css.divider} />
						</>
					)}

					<AutoSizeTextArea
						ref={textAreaApiRef}
						resetKey={expanded}
						className={css.textarea}
						disabled={mailData.sending}
						placeholder="Make a new post"
						maxHeight={400}
						rows={expanded ? 4 : 1}
						value={mailData.plainTextData}
						onChangeValue={value => {
							mailData.plainTextData = value;
						}}
						onFocus={() => setExpanded(true)}
					/>

					{expanded ? (
						<>
							{(!!previewSrc || isPreviewLoading) && (
								<>
									<div className={css.divider} />

									{isPreviewLoading ? (
										<Spinner className={css.previewLoader} />
									) : (
										<div className={css.preview}>
											<img
												className={
													allowCustomAttachments ? css.previewCustomImage : css.previewSticker
												}
												alt="Preview"
												src={previewSrc}
											/>

											<ActionButton
												isDisabled={mailData.sending}
												look={ActionButtonLook.DANGEROUS}
												icon={<TrashSvg />}
												onClick={removeAttachment}
											>
												Remove attachment
											</ActionButton>
										</div>
									)}
								</>
							)}

							<div className={css.divider} />

							<div className={css.footer}>
								<AccountSelect
									className={css.accontSelect}
									accounts={accounts}
									activeAccount={mailData.from}
									onChange={account => (mailData.from = account)}
								/>

								<div className={css.footerRight}>
									{isUnavailable ? (
										<div>Can't post now. Wait a minute.</div>
									) : (
										<>
											{allowCustomAttachments ? (
												<ActionButton
													isDisabled={isPreviewLoading || mailData.sending}
													size={ActionButtonSize.MEDIUM}
													look={ActionButtonLook.LITE}
													icon={<ImageSvg />}
													title="Attach image"
													onClick={attachFile}
												/>
											) : (
												<>
													<ActionButton
														ref={stickerButtonRef}
														isDisabled={mailData.sending}
														size={ActionButtonSize.MEDIUM}
														look={ActionButtonLook.LITE}
														icon={<StickerSvg />}
														title="Stickers"
														onClick={() => setStickerPopupOpen(!isStickerPopupOpen)}
													/>

													{isStickerPopupOpen && (
														<AnchoredPopup
															className={css.stickerPopup}
															anchorRef={stickerButtonRef}
															horizontalAlign={HorizontalAlignment.END}
															alignerOptions={{
																fitLeftToViewport: true,
															}}
															onCloseRequest={() => setStickerPopupOpen(false)}
														>
															<div className={css.stickerPopupContent}>
																{stickerIpfsIds.map((id, i) => (
																	<img
																		key={i}
																		alt="Sticker"
																		src={ipfsToHttpUrl(id)}
																		onClick={() => attachSticker(id)}
																	/>
																))}
															</div>
														</AnchoredPopup>
													)}
												</>
											)}

											<SendMailButton
												mailData={mailData}
												disableNetworkSwitch={fixedEvmNetwork != null}
												onSent={onSent}
											/>
										</>
									)}
								</div>
							</div>
						</>
					) : (
						<ActionButton isDisabled size={ActionButtonSize.MEDIUM} look={ActionButtonLook.SECONDARY}>
							Post
						</ActionButton>
					)}
				</div>
			);
		},
	),
);

//

const stopWords = [
	'arse',
	'arsehole',
	'as useful as tits on a bull',
	'balls',
	'bastard',
	'beaver',
	'beef curtains',
	'bell',
	'bellend',
	'bent',
	'berk',
	'bint',
	'bitch',
	'blighter',
	'blimey',
	"blimey o'reilly",
	'bloodclaat',
	'bloody',
	'bloody hell',
	'blooming',
	'bollocks',
	'bonk',
	'bugger',
	'bugger me',
	'bugger off',
	'built like a brick shit-house',
	'bukkake',
	'bullshit',
	'cack',
	'cad',
	'chav',
	'cheese eating surrender monkey',
	'choad',
	'chuffer',
	'clunge',
	'cobblers',
	'cock',
	'cock cheese',
	'cock jockey',
	'cock-up',
	'cocksucker',
	'cockwomble',
	'codger',
	'cor blimey',
	'corey',
	'cow',
	'crap',
	'crikey',
	'cunt',
	'daft',
	'daft cow',
	'damn',
	'dick',
	'dickhead',
	'did he bollocks!',
	'did i fuck as like!',
	'dildo',
	'dodgy',
	'duffer',
	'fanny',
	'feck',
	'flaps',
	'fuck',
	'fuck me sideways!',
	'fucking cunt',
	'fucktard',
	'gash',
	'ginger',
	'git',
	'gob shite',
	'goddam',
	'gorblimey',
	'gordon bennett',
	'gormless',
	'he’s a knob',
	'hell',
	'hobknocker',
	"I'd rather snort my own cum",
	'jesus christ',
	'jizz',
	'knob',
	'knobber',
	'knobend',
	'knobhead',
	'ligger',
	"like fucking a dying man's handshake",
	'mad as a hatter',
	'manky',
	'minge',
	'minger',
	'minging',
	'motherfucker',
	'munter',
	'muppet',
	'naff',
	'nitwit',
	'nonce',
	'numpty',
	'nutter',
	'off their rocker',
	'penguin',
	'pillock',
	'pish',
	'piss off',
	'piss-flaps',
	'pissed',
	'pissed off',
	'play the five-fingered flute',
	'plonker',
	'ponce',
	'poof',
	'pouf',
	'poxy',
	'prat',
	'prick',
	'prick',
	'prickteaser',
	'punani',
	'punny',
	'pussy',
	'randy',
	'rapey',
	'rat arsed',
	'rotter',
	'rubbish',
	'scrubber',
	'shag',
	'shit',
	'shite',
	'shitfaced',
	'skank',
	'slag',
	'slapper',
	'slut',
	'snatch',
	'sod',
	'sod-off',
	'son of a bitch',
	'spunk',
	'stick it up your arse!',
	'swine',
	'taking the piss',
	'tart',
	'tits',
	'toff',
	'tosser',
	'trollop',
	'tuss',
	'twat',
	'twonk',
	'u fukin wanker',
	'wally',
	'wanker',
	'wankstain',
	'wazzack',
	'whore',
	'2 girls 1 cup',
	'2g1c',
	'4r5e',
	'5h1t',
	'5hit',
	'a_s_s',
	'a55',
	'acrotomophilia',
	'alabama hot pocket',
	'alaskan pipeline',
	'anal',
	'anilingus',
	'anus',
	'apeshit',
	'ar5e',
	'arrse',
	'arse',
	'arsehole',
	'ass',
	'ass-fucker',
	'ass-hat',
	'ass-jabber',
	'ass-pirate',
	'assbag',
	'assbandit',
	'assbanger',
	'assbite',
	'assclown',
	'asscock',
	'asscracker',
	'asses',
	'assface',
	'assfuck',
	'assfucker',
	'assfukka',
	'assgoblin',
	'asshat',
	'asshead',
	'asshole',
	'assholes',
	'asshopper',
	'assjacker',
	'asslick',
	'asslicker',
	'assmonkey',
	'assmunch',
	'assmuncher',
	'assnigger',
	'asspirate',
	'assshit',
	'assshole',
	'asssucker',
	'asswad',
	'asswhole',
	'asswipe',
	'auto erotic',
	'autoerotic',
	'axwound',
	'b!tch',
	'b00bs',
	'b17ch',
	'b1tch',
	'babeland',
	'baby batter',
	'baby juice',
	'ball gag',
	'ball gravy',
	'ball kicking',
	'ball licking',
	'ball sack',
	'ball sucking',
	'ballbag',
	'balls',
	'ballsack',
	'bampot',
	'bangbros',
	'bareback',
	'barely legal',
	'barenaked',
	'bastard',
	'bastardo',
	'bastinado',
	'bbw',
	'bdsm',
	'beaner',
	'beaners',
	'beastial',
	'beastiality',
	'beaver cleaver',
	'beaver lips',
	'bellend',
	'bestial',
	'bestiality',
	'bi+ch',
	'biatch',
	'big black',
	'big breasts',
	'big knockers',
	'big tits',
	'bimbos',
	'birdlock',
	'bitch',
	'bitchass',
	'bitcher',
	'bitchers',
	'bitches',
	'bitchin',
	'bitching',
	'bitchtits',
	'bitchy',
	'black cock',
	'blonde action',
	'blonde on blonde action',
	'bloody',
	'blow job',
	'blow your load',
	'blowjob',
	'blowjobs',
	'blue waffle',
	'blumpkin',
	'boiolas',
	'bollock',
	'bollocks',
	'bollok',
	'bollox',
	'bondage',
	'boner',
	'boob',
	'boobs',
	'booobs',
	'boooobs',
	'booooobs',
	'booooooobs',
	'booty call',
	'breasts',
	'breeder',
	'brotherfucker',
	'brown showers',
	'brunette action',
	'buceta',
	'bugger',
	'bukkake',
	'bulldyke',
	'bullet vibe',
	'bullshit',
	'bum',
	'bumblefuck',
	'bung hole',
	'bunghole',
	'bunny fucker',
	'busty',
	'butt',
	'butt plug',
	'butt-pirate',
	'buttcheeks',
	'buttfucka',
	'buttfucker',
	'butthole',
	'buttmuch',
	'buttplug',
	'c0ck',
	'c0cksucker',
	'camel toe',
	'camgirl',
	'camslut',
	'camwhore',
	'carpet muncher',
	'carpetmuncher',
	'cawk',
	'chesticle',
	'chinc',
	'chink',
	'choad',
	'chocolate rosebuds',
	'chode',
	'cipa',
	'circlejerk',
	'cl1t',
	'cleveland steamer',
	'clit',
	'clitface',
	'clitfuck',
	'clitoris',
	'clits',
	'clover clamps',
	'clusterfuck',
	'cnut',
	'cock',
	'cock-sucker',
	'cockass',
	'cockbite',
	'cockburger',
	'cockeye',
	'cockface',
	'cockfucker',
	'cockhead',
	'cockjockey',
	'cockknoker',
	'cocklump',
	'cockmaster',
	'cockmongler',
	'cockmongruel',
	'cockmonkey',
	'cockmunch',
	'cockmuncher',
	'cocknose',
	'cocknugget',
	'cocks',
	'cockshit',
	'cocksmith',
	'cocksmoke',
	'cocksmoker',
	'cocksniffer',
	'cocksuck',
	'cocksucked',
	'cocksucker',
	'cocksucking',
	'cocksucks',
	'cocksuka',
	'cocksukka',
	'cockwaffle',
	'cok',
	'cokmuncher',
	'coksucka',
	'coochie',
	'coochy',
	'coon',
	'coons',
	'cooter',
	'coprolagnia',
	'coprophilia',
	'cornhole',
	'cox',
	'cracker',
	'crap',
	'creampie',
	'crotte',
	'cum',
	'cumbubble',
	'cumdumpster',
	'cumguzzler',
	'cumjockey',
	'cummer',
	'cumming',
	'cums',
	'cumshot',
	'cumslut',
	'cumtart',
	'cunilingus',
	'cunillingus',
	'cunnie',
	'cunnilingus',
	'cunt',
	'cuntass',
	'cuntface',
	'cunthole',
	'cuntlick',
	'cuntlicker',
	'cuntlicking',
	'cuntrag',
	'cunts',
	'cuntslut',
	'cyalis',
	'cyberfuc',
	'cyberfuck',
	'cyberfucked',
	'cyberfucker',
	'cyberfuckers',
	'cyberfucking',
	'd1ck',
	'dago',
	'damn',
	'darkie',
	'date rape',
	'daterape',
	'deep throat',
	'deepthroat',
	'deggo',
	'dendrophilia',
	'dick',
	'dick-sneeze',
	'dickbag',
	'dickbeaters',
	'dickface',
	'dickfuck',
	'dickfucker',
	'dickhead',
	'dickhole',
	'dickjuice',
	'dickmilk ',
	'dickmonger',
	'dicks',
	'dickslap',
	'dicksucker',
	'dicksucking',
	'dicktickler',
	'dickwad',
	'dickweasel',
	'dickweed',
	'dickwod',
	'dike',
	'dildo',
	'dildos',
	'dingleberries',
	'dingleberry',
	'dink',
	'dinks',
	'dipshit',
	'dirsa',
	'dirty pillows',
	'dirty sanchez',
	'dlck',
	'dog style',
	'dog-fucker',
	'doggie style',
	'doggiestyle',
	'doggin',
	'dogging',
	'doggy style',
	'doggystyle',
	'dolcett',
	'domination',
	'dominatrix',
	'dommes',
	'donkey punch',
	'donkeyribber',
	'doochbag',
	'dookie',
	'doosh',
	'double dong',
	'double penetration',
	'doublelift',
	'douche',
	'douche-fag',
	'douchebag',
	'douchewaffle',
	'dp action',
	'dry hump',
	'duche',
	'dumass',
	'dumb ass',
	'dumbass',
	'dumbcunt',
	'dumbfuck',
	'dumbshit',
	'dumshit',
	'dvda',
	'dyke',
	'eat my ass',
	'ecchi',
	'ejaculate',
	'ejaculated',
	'ejaculates',
	'ejaculating',
	'ejaculatings',
	'ejaculation',
	'ejakulate',
	'erotic',
	'erotism',
	'escort',
	'eunuch',
	'f u c k',
	'f u c k e r',
	'f_u_c_k',
	'f4nny',
	'fag',
	'fagbag',
	'fagfucker',
	'fagging',
	'faggit',
	'faggitt',
	'faggot',
	'faggotcock',
	'faggs',
	'fagot',
	'fagots',
	'fags',
	'fagtard',
	'fanny',
	'fannyflaps',
	'fannyfucker',
	'fanyy',
	'fatass',
	'fcuk',
	'fcuker',
	'fcuking',
	'fecal',
	'feck',
	'fecker',
	'felch',
	'felching',
	'fellate',
	'fellatio',
	'feltch',
	'female squirting',
	'femdom',
	'figging',
	'fingerbang',
	'fingerfuck',
	'fingerfucked',
	'fingerfucker',
	'fingerfuckers',
	'fingerfucking',
	'fingerfucks',
	'fingering',
	'fistfuck',
	'fistfucked',
	'fistfucker',
	'fistfuckers',
	'fistfucking',
	'fistfuckings',
	'fistfucks',
	'fisting',
	'flamer',
	'flange',
	'foah',
	'fook',
	'fooker',
	'foot fetish',
	'footjob',
	'frotting',
	'fuck',
	'fuck buttons',
	'fuck off',
	'fucka',
	'fuckass',
	'fuckbag',
	'fuckboy',
	'fuckbrain',
	'fuckbutt',
	'fuckbutter',
	'fucked',
	'fucker',
	'fuckers',
	'fuckersucker',
	'fuckface',
	'fuckhead',
	'fuckheads',
	'fuckhole',
	'fuckin',
	'fucking',
	'fuckings',
	'fuckingshitmotherfucker',
	'fuckme',
	'fucknut',
	'fucknutt',
	'fuckoff',
	'fucks',
	'fuckstick',
	'fucktard',
	'fucktards',
	'fucktart',
	'fucktwat',
	'fuckup',
	'fuckwad',
	'fuckwhit',
	'fuckwit',
	'fuckwitt',
	'fudge packer',
	'fudgepacker',
	'fuk',
	'fuker',
	'fukker',
	'fukkin',
	'fuks',
	'fukwhit',
	'fukwit',
	'futanari',
	'fux',
	'fux0r',
	'g-spot',
	'gang bang',
	'gangbang',
	'gangbanged',
	'gangbangs',
	'gay',
	'gay sex',
	'gayass',
	'gaybob',
	'gaydo',
	'gayfuck',
	'gayfuckist',
	'gaylord',
	'gaysex',
	'gaytard',
	'gaywad',
	'genitals',
	'giant cock',
	'girl on',
	'girl on top',
	'girls gone wild',
	'goatcx',
	'goatse',
	'god damn',
	'god-dam',
	'god-damned',
	'goddamn',
	'goddamned',
	'goddamnit',
	'gokkun',
	'golden shower',
	'goo girl',
	'gooch',
	'goodpoop',
	'gook',
	'goregasm',
	'gringo',
	'grope',
	'group sex',
	'guido',
	'guro',
	'hand job',
	'handjob',
	'hard core',
	'hard on',
	'hardcore',
	'hardcoresex',
	'heeb',
	'hell',
	'hentai',
	'heshe',
	'ho',
	'hoar',
	'hoare',
	'hoe',
	'hoer',
	'homo',
	'homodumbshit',
	'homoerotic',
	'honkey',
	'hooker',
	'hore',
	'horniest',
	'horny',
	'hot carl',
	'hot chick',
	'hotsex',
	'how to kill',
	'how to murder',
	'huge fat',
	'humping',
	'incest',
	'intercourse',
	'jack Off',
	'jack-off',
	'jackass',
	'jackoff',
	'jaggi',
	'jagoff',
	'jail bait',
	'jailbait',
	'jap',
	'jelly donut',
	'jerk off',
	'jerk-off',
	'jerkass',
	'jigaboo',
	'jiggaboo',
	'jiggerboo',
	'jism',
	'jiz',
	'jizm',
	'jizz',
	'juggs',
	'jungle bunny',
	'junglebunny',
	'kawk',
	'kike',
	'kinbaku',
	'kinkster',
	'kinky',
	'knob',
	'knobbing',
	'knobead',
	'knobed',
	'knobend',
	'knobhead',
	'knobjocky',
	'knobjokey',
	'kock',
	'kondum',
	'kondums',
	'kooch',
	'kootch',
	'kraut',
	'kum',
	'kummer',
	'kumming',
	'kums',
	'kunilingus',
	'kunja',
	'kunt',
	'kyke',
	'l3i+ch',
	'l3itch',
	'labia',
	'lameass',
	'lardass',
	'leather restraint',
	'leather straight jacket',
	'lemon party',
	'lesbian',
	'lesbo',
	'lezzie',
	'lmfao',
	'lolita',
	'lovemaking',
	'lust',
	'lusting',
	'm0f0',
	'm0fo',
	'm45terbate',
	'ma5terb8',
	'ma5terbate',
	'make me come',
	'male squirting',
	'masochist',
	'master-bate',
	'masterb8',
	'masterbat',
	'masterbat3',
	'masterbate',
	'masterbation',
	'masterbations',
	'masturbate',
	'mcfagget',
	'menage a trois',
	'mick',
	'milf',
	'minge',
	'missionary position',
	'mo-fo',
	'mof0',
	'mofo',
	'mothafuck',
	'mothafucka',
	'mothafuckas',
	'mothafuckaz',
	'mothafucked',
	'mothafucker',
	'mothafuckers',
	'mothafuckin',
	'mothafucking',
	'mothafuckings',
	'mothafucks',
	'mother fucker',
	'motherfuck',
	'motherfucked',
	'motherfucker',
	'motherfuckers',
	'motherfuckin',
	'motherfucking',
	'motherfuckings',
	'motherfuckka',
	'motherfucks',
	'mound of venus',
	'mr hands',
	'muff',
	'muff diver',
	'muffdiver',
	'muffdiving',
	'munging',
	'mutha',
	'muthafecker',
	'muthafuckker',
	'muther',
	'mutherfucker',
	'n1gga',
	'n1gger',
	'nambla',
	'nawashi',
	'nazi',
	'negro',
	'neonazi',
	'nig nog',
	'nigaboo',
	'nigg3r',
	'nigg4h',
	'nigga',
	'niggah',
	'niggas',
	'niggaz',
	'nigger',
	'niggers',
	'niglet',
	'nimphomania',
	'nipple',
	'nipples',
	'nob',
	'nob jokey',
	'nobhead',
	'nobjocky',
	'nobjokey',
	'nsfw images',
	'nude',
	'nudity',
	'numbnuts',
	'nut sack',
	'nutsack',
	'nympho',
	'nymphomania',
	'octopussy',
	'omorashi',
	'one cup two girls',
	'one guy one jar',
	'orgasim',
	'orgasims',
	'orgasm',
	'orgasms',
	'orgy',
	'p0rn',
	'paedophile',
	'paki',
	'panooch',
	'panties',
	'panty',
	'pawn',
	'pecker',
	'peckerhead',
	'pedobear',
	'pedophile',
	'pegging',
	'penis',
	'penisbanger',
	'penisfucker',
	'penispuffer',
	'phone sex',
	'phonesex',
	'phuck',
	'phuk',
	'phuked',
	'phuking',
	'phukked',
	'phukking',
	'phuks',
	'phuq',
	'piece of shit',
	'pigfucker',
	'pimpis',
	'piss',
	'piss pig',
	'pissed',
	'pissed off',
	'pisser',
	'pissers',
	'pisses',
	'pissflaps',
	'pissin',
	'pissing',
	'pissoff',
	'pisspig',
	'playboy',
	'pleasure chest',
	'pole smoker',
	'polesmoker',
	'pollock',
	'ponyplay',
	'poof',
	'poon',
	'poonani',
	'poonany',
	'poontang',
	'poop',
	'poop chute',
	'poopchute',
	'poopuncher',
	'porch monkey',
	'porchmonkey',
	'porn',
	'porno',
	'pornography',
	'pornos',
	'prick',
	'pricks',
	'prince albert piercing',
	'pron',
	'pthc',
	'pube',
	'pubes',
	'punanny',
	'punany',
	'punta',
	'pusse',
	'pussi',
	'pussies',
	'pussy',
	'pussylicking',
	'pussys',
	'pust',
	'puto',
	'queaf',
	'queef',
	'queer',
	'queerbait',
	'queerhole',
	'quim',
	'raghead',
	'raging boner',
	'rape',
	'raping',
	'rapist',
	'rectum',
	'renob',
	'retard',
	'reverse cowgirl',
	'rimjaw',
	'rimjob',
	'rimming',
	'rosy palm',
	'rosy palm and her 5 sisters',
	'ruski',
	'rusty trombone',
	's.o.b.',
	's&m',
	'sadism',
	'sadist',
	'sand nigger',
	'sandler',
	'sandnigger',
	'sanger',
	'santorum',
	'scat',
	'schlong',
	'scissoring',
	'screwing',
	'scroat',
	'scrote',
	'scrotum',
	'seks',
	'semen',
	'sex',
	'sexo',
	'sexy',
	'shag',
	'shagger',
	'shaggin',
	'shagging',
	'shaved beaver',
	'shaved pussy',
	'shemale',
	'shi+',
	'shibari',
	'shit',
	'shitass',
	'shitbag',
	'shitbagger',
	'shitblimp',
	'shitbrains',
	'shitbreath',
	'shitcanned',
	'shitcunt',
	'shitdick',
	'shite',
	'shited',
	'shitey',
	'shitface',
	'shitfaced',
	'shitfuck',
	'shitfull',
	'shithead',
	'shithole',
	'shithouse',
	'shiting',
	'shitings',
	'shits',
	'shitspitter',
	'shitstain',
	'shitted',
	'shitter',
	'shitters',
	'shittiest',
	'shitting',
	'shittings',
	'shitty',
	'shiz',
	'shiznit',
	'shota',
	'shrimping',
	'skank',
	'skeet',
	'skullfuck',
	'slag',
	'slanteye',
	'slut',
	'slutbag',
	'sluts',
	'smeg',
	'smegma',
	'smut',
	'snatch',
	'snowballing',
	'sodomize',
	'sodomy',
	'son-of-a-bitch',
	'spac',
	'spic',
	'spick',
	'splooge',
	'splooge moose',
	'spooge',
	'spook',
	'spread legs',
	'spunk',
	'strap on',
	'strapon',
	'strappado',
	'strip club',
	'style doggy',
	'suck',
	'suckass',
	'sucks',
	'suicide girls',
	'sultry women',
	'swastika',
	'swinger',
	't1tt1e5',
	't1tties',
	'tainted love',
	'tard',
	'taste my',
	'tea bagging',
	'teets',
	'teez',
	'testical',
	'testicle',
	'threesome',
	'throating',
	'thundercunt',
	'tied up',
	'tight white',
	'tit',
	'titfuck',
	'tits',
	'titt',
	'tittie5',
	'tittiefucker',
	'titties',
	'titty',
	'tittyfuck',
	'tittywank',
	'titwank',
	'tongue in a',
	'topless',
	'tosser',
	'towelhead',
	'tranny',
	'tribadism',
	'tub girl',
	'tubgirl',
	'turd',
	'tushy',
	'tw4t',
	'twat',
	'twathead',
	'twatlips',
	'twats',
	'twatty',
	'twatwaffle',
	'twink',
	'twinkie',
	'two girls one cup',
	'twunt',
	'twunter',
	'unclefucker',
	'undressing',
	'upskirt',
	'urethra play',
	'urophilia',
	'v14gra',
	'v1gra',
	'va-j-j',
	'vag',
	'vagina',
	'vajayjay',
	'venus mound',
	'viagra',
	'vibrator',
	'violet wand',
	'vjayjay',
	'vorarephilia',
	'voyeur',
	'vulva',
	'w00se',
	'wang',
	'wank',
	'wanker',
	'wankjob',
	'wanky',
	'wet dream',
	'wetback',
	'white power',
	'whoar',
	'whore',
	'whorebag',
	'whoreface',
	'willies',
	'willy',
	'wop',
	'wrapping men',
	'wrinkled starfish',
	'xrated',
	'xx',
	'xxx',
	'yaoi',
	'yellow showers',
	'yiffy',
	'zoophilia',
	'zubb',
	'a$$',
	'a$$hole',
	'a55hole',
	'ahole',
	'anal impaler',
	'anal leakage',
	'analprobe',
	'ass fuck',
	'ass hole',
	'assbang',
	'assbanged',
	'assbangs',
	'assfaces',
	'assh0le',
	'beatch',
	'bimbo',
	'bitch tit',
	'bitched',
	'bloody hell',
	'bootee',
	'bootie',
	'bull shit',
	'bullshits',
	'bullshitted',
	'bullturds',
	'bum boy',
	'butt fuck',
	'buttfuck',
	'buttmunch',
	'c-0-c-k',
	'c-o-c-k',
	'c-u-n-t',
	'c.0.c.k',
	'c.o.c.k.',
	'c.u.n.t',
	'caca',
	'cacafuego',
	'chi-chi man',
	'child-fucker',
	'clit licker',
	'cock sucker',
	'corksucker',
	'corp whore',
	'crackwhore',
	'dammit',
	'damned',
	'damnit',
	'darn',
	'dick head',
	'dick hole',
	'dick shy',
	'dick-ish',
	'dickdipper',
	'dickflipper',
	'dickheads',
	'dickish',
	'f-u-c-k',
	'f.u.c.k',
	'fist fuck',
	'fuck hole',
	'fuck puppet',
	'fuck trophy',
	'fuck yo mama',
	'fuck you',
	'fuck-ass',
	'fuck-bitch',
	'fuck-tard',
	'fuckedup',
	'fuckmeat',
	'fucknugget',
	'fucktoy',
	'fuq',
	'gassy ass',
	'h0m0',
	'h0mo',
	'ham flap',
	'he-she',
	'hircismus',
	'holy shit',
	'hom0',
	'hoor',
	'jackasses',
	'jackhole',
	'middle finger',
	'moo foo',
	'naked',
	'p.u.s.s.y.',
	'piss off',
	'piss-off',
	'rubbish',
	's-o-b',
	's0b',
	'shit ass',
	'shit fucker',
	'shiteater',
	'son of a bitch',
	'son of a whore',
	'two fingers',
	'wh0re',
	'wh0reface',
];
