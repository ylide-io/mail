import React from 'react';
import MainLayout from '../../layouts/MainLayout';
import SmallButton, { smallButtonColors, smallButtonIcons } from '../../components/smallButton/smallButton';
import MailboxBody from './components/Mailbox/MailboxBody';
import Tooltip from './components/Mailbox/tooltip';
import { useNav } from '../../utils/navigate';
import mailer from '../../stores/Mailer';
import { observer } from 'mobx-react';
import { Loader } from '../../controls/Loader';

const ComposePage = observer(() => {
	const navigate = useNav();

	return (
		<MainLayout>
			<div className="col-lg-10 animated fadeInRight">
				<div className="mail-box-header">
					<div className="float-right tooltip-demo">
						<SmallButton
							onClick={() => {
								navigate('/mailbox');
							}}
							text={'Discard'}
							color={smallButtonColors.red}
							title={'Discard email'}
							icon={smallButtonIcons.cross}
						/>
					</div>
					<h2>Compose mail</h2>
				</div>
				<div className="mail-box" style={{ position: 'relative' }}>
					<MailboxBody />
					<Tooltip />
					<div className="clearfix"></div>
					{mailer.sending ? (
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
								zIndex: 200,
								backdropFilter: 'blur(10px)',
							}}
						>
							<Loader />
							<br />
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									paddingTop: 200,
									position: 'absolute',
									left: 0,
									right: 0,
									top: 0,
									bottom: 0,
									zIndex: 201,
									color: 'black',
									fontSize: 20,
									fontWeight: 'bold',
								}}
							>
								Broadcasting your message to blockchain...
							</div>
						</div>
					) : null}
				</div>
			</div>
		</MainLayout>
	);
});

export default ComposePage;
