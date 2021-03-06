import React from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';
import { YlideButton } from '../../controls/YlideButton';
import { ArrowRight } from '../../icons/ArrowRight';
import { useNavigate } from 'react-router-dom';
import { MetaMaskLogo } from '../../icons/MetaMaskLogo';

import './style.scss';
import domain from '../../stores/Domain';
import { EthereumLogo } from '../../icons/EthereumLogo';
import { BNBChainLogo } from '../../icons/BNBChainLogo';
import { SolanaLogo } from '../../icons/SolanaLogo';
import { PhantomLogo } from '../../icons/PhantomLogo';
import { NearLogo } from '../../icons/NearLogo';
import EverscaleLogo from '../../icons/EverscaleLogo';
import { useState } from 'react';
import { Spin } from 'antd';

const blockchainsMap: Record<string, { title: string; logo: JSX.Element }> = {
	everscale: {
		title: 'EverScale',
		logo: <EverscaleLogo size={16} />,
	},
	ethereum: {
		title: 'Ethereum',
		logo: <EthereumLogo size={16} />,
	},
	bnbchain: {
		title: 'BNB Chain',
		logo: <BNBChainLogo size={16} />,
	},
	solana: {
		title: 'Solana',
		logo: <SolanaLogo size={16} />,
	},
	near: {
		title: 'Near',
		logo: <NearLogo size={30} />,
	},
};

const walletsMap: Record<string, { title: string; link: string; logo: JSX.Element }> = {
	metamask: {
		title: 'MetaMask',
		logo: <MetaMaskLogo size={30} />,
		link: 'https://metamask.io/',
	},
	everwallet: {
		title: 'EverWallet',
		logo: <EverscaleLogo size={30} />,
		link: 'https://l1.broxus.com/freeton/wallet',
	},
	phantom: {
		title: 'Phantom',
		logo: <PhantomLogo size={30} />,
		link: 'https://l1.broxus.com/freeton/wallet',
	},
};

const ConnectWalletsPage = observer(() => {
	const navigate = useNavigate();
	const [helperModal, setHelperModal] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	let titleText = 'Connect your wallets';
	let subtitleText = 'We found some wallets in your browser which you can use with Ylide';

	const firstTime = document.location.search.includes('firstTime=true');

	const topWallets: { wallet: string; blockchains: string[] }[] = [
		{
			wallet: 'everwallet',
			blockchains: ['everscale'],
		},
		{
			wallet: 'metamask',
			blockchains: ['ethereum', 'bnbchain'],
		},
		{
			wallet: 'phantom',
			blockchains: ['solana'],
		},
	];

	let content = (
		<div className="wallets-block">
			{topWallets.map(({ blockchains, wallet }) => {
				const wData = walletsMap[wallet];
				const isWalletSupported = domain.availableSenders.find(t => t.wallet === wallet);
				const isWalletAvailable = domain.availableWallets.find(t => t.wallet === wallet);
				const isWalletConnected = domain.connectedWallets.find(t => t.wallet === wallet);
				const isKeyDerived = !isWalletConnected
					? null
					: domain.connectedKeys.find(
							t =>
								t.blockchain === isWalletConnected.blockchain &&
								t.address === isWalletConnected.account.address,
					  );
				return (
					<div
						className={cn('wallet-block', {
							'not-available': !isWalletSupported,
							'ready': !!isKeyDerived,
						})}
					>
						<div className="wb-head">
							<div className="wb-head-left">
								<div className="wb-logo">{wData.logo}</div>
								<div className="wb-title">{wData.title}</div>
							</div>
							<div className="wb-head-right">
								{isKeyDerived ? (
									<div
										style={{
											padding: '12px 20px',
											fontSize: 14,
										}}
									>
										<b>Ready</b>
									</div>
								) : (
									<YlideButton
										onClick={async () => {
											if (!isWalletAvailable) {
												window.open(wData.link, '_blank');
											} else if (!isWalletConnected) {
												const me = await domain.senders[isWalletSupported!.blockchain][
													isWalletSupported!.wallet
												].requestAuthentication();
												if (me) {
													await domain.extractWalletsData();
												}
											} else if (!isKeyDerived) {
												const me = (await domain.senders[isWalletSupported!.blockchain][
													isWalletSupported!.wallet
												].getAuthenticatedAccount())!;
												const password = await domain.handlePasswordRequest(
													`connect ${wData.title}`,
												);
												if (!password) {
													return;
												}
												const reader = domain.readers[isWalletSupported!.blockchain];
												const sender =
													domain.senders[isWalletSupported!.blockchain][
														isWalletSupported!.wallet
													];
												setHelperModal('sign');
												const tempKey = await domain.keystore.create(
													`create Ylide KeyPair`,
													isWalletSupported!.blockchain,
													isWalletSupported!.wallet,
													me.address,
													password,
												);
												setHelperModal(null);
												if (!firstTime) {
													const registeredPublicKey =
														await reader.extractPublicKeyFromAddress(me.address);
													console.log('registeredPublicKey: ', registeredPublicKey);
													if (!registeredPublicKey) {
														setLoading(true);
														setHelperModal('publish');
														await sender.attachPublicKey(tempKey.publicKey);
														setHelperModal(null);
														setLoading(false);
													} else {
														if (
															registeredPublicKey.bytes.length !==
																tempKey.publicKey.length ||
															!registeredPublicKey.bytes.every(
																(v, idx) => v === tempKey.publicKey[idx],
															)
														) {
															alert('Wrong password. Please, try again');
															domain.keystore.keys.splice(
																domain.keystore.keys.findIndex(g => g.key === tempKey),
																1,
															);
															await domain.keystore.save();
														}
													}
												} else {
													setLoading(true);
													setHelperModal('publish');
													await sender.attachPublicKey(tempKey.publicKey);
													setHelperModal(null);
													setLoading(false);
												}
												await domain.extractWalletsData();
											}
										}}
									>
										{loading ? (
											<Spin />
										) : isWalletAvailable ? (
											isWalletConnected ? (
												`Activate`
											) : (
												'Connect'
											)
										) : (
											'Install'
										)}
									</YlideButton>
								)}
							</div>
						</div>
						<div className="wb-body">
							<div className="wb-title">Blockchains:</div>
							<div className="wb-chains-list">
								{blockchains.map(blockchain => {
									const bData = blockchainsMap[blockchain];
									const isChainSupported = domain.availableSenders.find(
										t => t.wallet === wallet && t.blockchain === blockchain,
									);
									return (
										<div
											className="wb-chain"
											style={{
												opacity: isChainSupported ? 1 : 0.6,
											}}
										>
											<div className="wb-chain-logo">{bData.logo}</div>
											<div className="wb-chain-title">{bData.title}</div>
										</div>
									);
								})}
							</div>
						</div>
						{!isWalletSupported ? <div className="wb-not-available">Coming soon, stay tuned</div> : null}
					</div>
				);
			})}
		</div>
	);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'flex-start',
				paddingTop: '5%',
				height: '100vh',
				width: '100vw',
				position: 'relative',
			}}
		>
			{helperModal !== null ? (
				<div
					style={{
						position: 'absolute',
						zIndex: 1000,
						left: 0,
						top: 0,
						right: 0,
						bottom: 0,
						backdropFilter: 'blur(10px)',
						background: 'rgba(255, 255, 255, 0.5)',
					}}
				>
					<div
						style={{
							position: 'absolute',
							zIndex: 1000,
							left: 100,
							top: 100,
							bottom: 100,
							width: 400,
							background: 'white',
							boxShadow: '5px 5px 0px black',
							borderRadius: 15,
							padding: 30,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							textAlign: 'center',
						}}
					>
						{helperModal === 'sign' ? (
							<>
								<h2
									style={{
										fontSize: 80,
										marginBottom: 50,
										marginTop: -80,
									}}
								>
									???
								</h2>
								<h3 style={{ fontSize: 22, fontWeight: '400' }}>
									We need you to sign your password so we can generate you
									<br />
									<div
										style={{
											marginTop: 15,
											fontWeight: 'bold',
										}}
									>
										a unique communication key
									</div>
								</h3>
								<img
									style={{
										marginTop: 40,
										marginBottom: -100,
									}}
									src="data:image/png;base64,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q+hfcyBg7ty5fNlll+k2LPff8i4lfh0ISSQSbJE6KoGdWoiojtLFHQIFrsWBBx5I/fv316vh2D1bKNsX86UJEybQUUcdRWqSSULlHHPMMaRE0JwsXAhvoVWJQc9XsXaD9oNXceyxx9I555xDhx122HZzFmQ9jBw5UufDFfs3SgUuI9xESyxqmZxaEurmWJV2Mb777js+44wzSooYKddBj3zTpk1jwQyqo7MShQ5557rnylXTEVblTrESDcfjcX7yySdZLcyyEhQr13u794QVUqLha6+9VlurUiK0pV6waj169GC1DsmWiJNf1Iti7ABz5sxhNbppoRS7kXAD1SSTJ02apBtM1pgqQy1qspp/sgoGaEFBOHjEwKbmNFoMDzzwgHbX1q1bp59f6J7jb2oxl5WV0p0erpgpEeFq27YtDx8+3Fa7J8kHO2QJKUEVFn00gfoc9PLLL9Odd96pgwuFXDwA046txojmYYek7FuqDNx/BHTeeustXXsQbhvuL9xuBA84E5go9h7IgIAb98orr+jUIiS1lgraEFehtke0Dmlm2AiovBiywCDfxfTZEWvkoaJHPGTIkJInpBg54eZZnnTWFBjli1mcXGzevJlnzZrFl1xyiXYRkZVCJVoYWCx4GSrKVzTohL+rObLuKxbwZY2yheRUD0TjIYPhoosuKpo+lC0mpLSMGDFC++vi5gUL7vfKlSv5wQcfZBW4YLWU4ctNg+DatGnDN910EyuPJO88zbvwXLh1ueZlBihvIyuHEPIuhWQyyX369NGT21IaA6MUfPqbb75ZT3BFTPbBPYYVmjx5srYkaCs/VggXwubt2rVjtTCvw+R33323FgoVsFwYNCdOnGijjTdwCadPFBITklST7BC4SfPmzdOT31Jzv9CIaBSsSS1evJiVr86CHdA+CxYs4Ouuu057Dn6tEC68Di7a+PHjtScBIcVisYLRPQyYHTt2ZLVUwhZoIBOoN6pjhywUGgtRokMPPbRky6QmiVp4Xbp00VGoLVu2sGAOtMn8+fO15W/fvr22KK1atfItIkTdzjzzTL1I61kWFeTQXgXaMN/rMHe+5pprtPAsECOTcDoA4czcafbs2TozudQ5Ey6MkBDUFVdcoS2bWsgVd68CMCCtXr2a77rrLt5///19tQW1sEK4Bg4cqF1wD7TNqFGjinofWI964403bLRlA9mC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"
								/>
							</>
						) : (
							<>
								<h2
									style={{
										fontSize: 80,
										marginBottom: 50,
										marginTop: -80,
									}}
								>
									????
								</h2>
								<h3 style={{ fontSize: 22, fontWeight: '400' }}>
									To receive messages from other people we need you to
									<br />
									<div
										style={{
											marginTop: 20,
											fontWeight: 'bold',
										}}
									>
										publish your public key
									</div>
								</h3>
								<img
									style={{
										marginTop: 40,
										marginBottom: -100,
									}}
									src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAACxCAYAAACx+eO2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAABgQSURBVHgB7Z1pkFNF18eP4r4iiyKiBkURFfcNER0VUMHtdQe34Fou5QNVuHxQGRApStR6ntKSD4oTy5IqwEIQxIXSGVFBlE2UwkIhQZRFVERFxO28/e/kDmHIdpPuezs351d1zTiThOR2//ucPn36NJEgCLUNMyfV1aCuOhIEwT9KPHHelkb8jgRBKJ2MNcpFUgQlCCUAV46LowWlrhgJgrA9GTeuVJKZeVSMBEFIA0Fw+TSIoASBtJASXDkNLJE+oVbhyqxRLhpZAhNCrcFmrFEukiIooSZg89Yor6BY5lFCVFGdexgHR5IlMCFEEc6/AGubBhGUEAl4+3SgMGhgifQJediBqgDVgZPqIUZu0KSul3bYYYcECUK1wG5Yo1wkWSJ9QgbnLRK7ZY1ykVLXcHU1KSuVIqEmcVpInJ6TNFJ1kKK02zdcBCU4BftLTnWJBpZIX03hrEXKdMQkVTcJSgcmmkiINC4LKaEebqZo0EQS6Ys0TgopItYoFylKz6ESJESKHclN6imaxNSF+VOSJacvUjhnkSJsjXKRIon0RQIXLVJU5kWlEFNXXF1JifRVNy5aJNcXYG2TIIn0VR1OCYnTKTcNJIAmkkhf1eCakGrdGuUiRRLpcx5n5kgZaxQjoSUxkkif8zhjkcQalUyKJNLnHE4IiasrOdUlEiSCcgJXhAQR1ZFQLgmSSF+ohC6kGluAtU0TSaQvFFwINtSTYIo6ygpMkBAYoVoksUbWSZHs3g2EsIWUoNpKCQqLFEmkzyqhCUmsUWgkSARlnDDnSGKJwiFOW5Nk60gwQpgWSRZg3aCJJNJXMaFYJEkHcoo6kkhfxYRikcQaOU2KJNLnm8CFJFslqoYUSaSvZMIQ0kL1cAIJ1USCRFAFCVRIkpxa9SRIcvpyErSQpqiHy0iodppIIn3bEJiQZAE2kqRIdu9qggx/15MQNWK0NXT+n1revRuIRRJrVDP8rC647zUXmAjKItWTUAu0phqt02fdImVuJkLerUmoRWCh/hf1SF8QFulyEhHVMmj/RqwfRjkFKQiLJOlAQjYpimCkz6pFkuRUIQcximCkz6pFEmsklEAkIn3WLJJYI6FEIhHps2aRJDlVqICqi/RZEZIkpwqGWERpQSXIcWy5doNJECoHHk1V7N41bpEkHUiwSEpd/1XXVNcCEzaElCCpECTYxblIn1EhiTUSQiBBDgjK9BypngQhWOKUDp2/FmadPmMWSZJTBUcIJdJn0iJJcqrgAqFE+kxaJEkHElwkRVuLtqTIEkaEJLXqhCohQZYCE6aEJNZIqCYSZFhQFc+RbCSnqvckQbBInNKRvkZTkb6KLVKlyakQzaZNm2ju3Lm0evVqWr58OfXr14+OO+442nXXXUmNGiQIlklRhZsNK+qllSanQkTr16+nIUOG0PTp0/Xv/v77b9pjjz3orLPOoqeeeoo6d+4sYhKCIkVlCqpSIZVdORUi+vPPP+mGG26gGTNm0F9//aUvsPPOO9Puu+9OBx98ME2aNIm6detGghAgKfIZ6St7jpRZgK2o/PC8efOosbFRC8oTEcDPv/32G6VSKXr22We1lRKEAIlROkun5M2GlQQb6qkC/vnnH3r66ae1ZcollH///Vc/Z/LkyfTTTz+RIIREnEoQVFlCyrxhRRnea9as0dbol19+yfscCKlt27a02267SSRPCJs4FYj0lWuR6qkCIIpvv/1Wz4Uglnzg7wg24FECDoIj1FG6Tt82KUi+hWRibgRRfPDBB3oulM/S4Dlw+Xr16qUtkiA4RozSOX06al2ORao4ORXiWbRokV4/ysdOO+2kw+C9e/cmQXCYFP5TjpD+QxUCS4P1o2KWpkuXLtS1a1dx64SceN5MyPNnHFxNO/l5hal0IIS7d9xxR/2Yj1atWlHHjh21ZRIETyy///47/fjjj/TRRx/R119/rTNg2rVrRyeeeKJeewx40E1460x+e+kwMgC+7MaNGwsGGiA0PAePQm0C8aCvrFixgpYtW0bz58+nF198UU8JvMF48+bN1KlTJ+29jBo1SgsrQDEN934oWUimk1NXrVpV0CTD/cNakrh1tYEnmi1btuilESzGT506lT7//HM9n/7jjz+0dwIB4efsvpNMJumHH36gyy+/XL+me/fuQfSbRHbWgx+LVPHcyAMmuGfPnjRt2rS8WQv4/TfffKNvrLh30cQTD9y1t99+m77//nuaOXMmzZo1qznbBe2P52FQzQeet2HDBv08LPLDagUgpJey/6ekHppZgDJafhhrQ5gH5QM3Dou18IX79OkjlqnKybYg6PSwNHDXsCi/ZMkS+uqrr2iXXXbRwsEg6jctDO8PNw/zp19//ZX23XdfskhTy3LKpQ71RiunQhSHH3540fkPTDhu+Pnnn19QdIK7QBBoZ7jyyPBfuXKltjgQD+bIEIBndSCESsDgDJEGsO74UstfFBWSiQXYXFxwwQX0zDPPaFHlmyvBKr3++ut03333iZCqgOx2hLWZM2cOffHFF/TJJ5/oCBssBdoRj3iu6bA1XDx4L9jHZpFUrm0WpVikerIAtkhARLix+cw4bgwmmosXL6aTTz6ZBLfw5jhoJ8xzFi5cqOcnyNxHm2HO42X1w7uwDQR08cUXN38uSwzP9cuC/5rNyqm4sQMGDNCTzEImfa+99qLzzjtPR2OE8PEsCdyx999/n2bPnq1FA8uD+QnaFS4bBFTI2zAN+gnWkqZMmUJt2rQhS8Aadc71h2IWqZ4sAT8W7t27775b8HlYM0DAARG8Qw45hITg8EZ2CAOBn7Vr19L48ePpyy+/1CUB4K55210gnJbrgkFmHOBznHTSSbTffvuRRYbn+0NeIWWs0TlkkQsvvJBGjx6tfeYCn0PfpHHjxtGjjz4qc6UAwD2HMGBhsHsZCcZY10GAAL9HaLrSwIBJPLGfeuqpNl26lLqayC9YgGXLKIHwbbfdxsosY+jKe6l1JFZrT6zcB/0awR4qMMC33nord+3alTt06MB77723bh81/yjYRmFeyrvhI488kn/++Web/aOByoHT+y2sgi/d1NSkRVLsZu2zzz58+umn88aNG1kwD9pi7Nix3KlTJ27dujXvueeezgqn5YXPe++999oeZGOF9JJzIYcDOkgZZhgZDkogpBqu4HMRCVq6dClNnDhRajgYRrW3LoWGrACk2qiRveAWFxMgu8VUxgpczb59+9p06xLFiqDkWxEdRgGBm4m5D1aiCy3QYp6EiNCYMWN0pEgwBzogggiojWEjTI15LULTaGNE144++mg65ZRTtJgqBf0H/QY7qS0yvNgTtuu5QVmjbM4++2xdxw4pIoXAyIPoHerdIdwqmAEWCZ3RpIiQZYCNmRAO1gwRob3nnnt0ePq1117TWdpsIKoHcaL/qDkSWaK8YzY5XdwhUODbKoFw9+7dS5rUYr6kGkVPLgUzzJw5U881iMqbp2DCjwvvoZYp+Nxzz+Wrr76a1fIGq+hfcyBg7ty5fNlll+k2LPff8i4lfh0ISSQSbJE6KoGdWoiojtLFHQIFrsWBBx5I/fv316vh2D1bKNsX86UJEybQUUcdRWqSSULlHHPMMaRE0JwsXAhvoVWJQc9XsXaD9oNXceyxx9I555xDhx122HZzFmQ9jBw5UufDFfs3SgUuI9xESyxqmZxaEurmWJV2Mb777js+44wzSooYKddBj3zTpk1jwQyqo7MShQ5557rnylXTEVblTrESDcfjcX7yySdZLcyyEhQr13u794QVUqLha6+9VlurUiK0pV6waj169GC1DsmWiJNf1Iti7ABz5sxhNbppoRS7kXAD1SSTJ02apBtM1pgqQy1qspp/sgoGaEFBOHjEwKbmNFoMDzzwgHbX1q1bp59f6J7jb2oxl5WV0p0erpgpEeFq27YtDx8+3Fa7J8kHO2QJKUEVFn00gfoc9PLLL9Odd96pgwuFXDwA046txojmYYek7FuqDNx/BHTeeustXXsQbhvuL9xuBA84E5go9h7IgIAb98orr+jUIiS1lgraEFehtke0Dmlm2AiovBiywCDfxfTZEWvkoaJHPGTIkJInpBg54eZZnnTWFBjli1mcXGzevJlnzZrFl1xyiXYRkZVCJVoYWCx4GSrKVzTohL+rObLuKxbwZY2yheRUD0TjIYPhoosuKpo+lC0mpLSMGDFC++vi5gUL7vfKlSv5wQcfZBW4YLWU4ctNg+DatGnDN910EyuPJO88zbvwXLh1ueZlBihvIyuHEPIuhWQyyX369NGT21IaA6MUfPqbb75ZT3BFTPbBPYYVmjx5srYkaCs/VggXwubt2rVjtTCvw+R33323FgoVsFwYNCdOnGijjTdwCadPFBITklST7BC4SfPmzdOT31Jzv9CIaBSsSS1evJiVr86CHdA+CxYs4Ouuu057Dn6tEC68Di7a+PHjtScBIcVisYLRPQyYHTt2ZLVUwhZoIBOoN6pjhywUGgtRokMPPbRky6QmiVp4Xbp00VGoLVu2sGAOtMn8+fO15W/fvr22KK1atfItIkTdzjzzTL1I61kWFeTQXgXaMN/rMHe+5pprtPAsECOTcDoA4czcafbs2TozudQ5Ey6MkBDUFVdcoS2bWsgVd68CMCCtXr2a77rrLt5///19tQW1sEK4Bg4cqF1wD7TNqFGjinofWI964403bLRlA9mC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"
								/>
							</>
						)}
					</div>
				</div>
			) : null}
			<div style={{ width: 300 }}>
				<h3
					style={{
						fontFamily: 'Lexend Exa',
						letterSpacing: '-0.06em',
						fontWeight: 400,
						textAlign: 'center',
						marginBottom: 30,
						fontSize: 24,
					}}
				>
					{titleText}
				</h3>
				<p
					style={{
						fontFamily: 'Lexend',
						fontWeight: 300,
						textAlign: 'center',
						fontSize: 16,
					}}
				>
					{subtitleText}
				</p>
				{domain.areThereAnyConnectedKeys ? (
					<div style={{ marginTop: 20 }}>
						<YlideButton
							onClick={() => {
								navigate('/mailbox');
							}}
						>
							Continue with connected wallets <ArrowRight style={{ marginLeft: 10 }} />
						</YlideButton>
					</div>
				) : null}
			</div>
			{content}
		</div>
	);
});

export default ConnectWalletsPage;
