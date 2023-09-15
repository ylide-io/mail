import clsx from 'clsx';
import { observer } from 'mobx-react';
import { useEffect, useRef, useState } from 'react';

import { APP_NAME } from '../../constants';
import { alignAtViewportCenterBottom } from '../../utils/alignment';
import { isIos, isPwa } from '../../utils/environment';
import { useOnMountAnimation } from '../../utils/useOnMountAnimation';
import { Popup } from '../popup/popup';
import css from './iosInstallPwaPopup.module.scss';
import { ReactComponent as IosShareIconSvg } from './iosShareIcon.svg';
import { ReactComponent as PopupArrowSvg } from './popupArrow.svg';

export const IosInstallPwaPopup = observer(() => {
	const rootRef = useRef(null);
	const isMount = useOnMountAnimation();
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setVisible(false), 15000);

		return () => clearTimeout(timer);
	}, []);

	if (!isIos() || isPwa()) {
		return <></>;
	}

	return (
		<Popup
			className={clsx(css.root, isMount && css.root_animate, visible || css.root_hiding)}
			align={alignAtViewportCenterBottom}
		>
			<div ref={rootRef} className={css.body}>
				<div className={css.title}>Install {APP_NAME} on your device</div>

				<div>
					Tap Share <IosShareIconSvg /> button and choose ‘Add to Home Screen’. Then open {APP_NAME} from your
					home screen.
				</div>
			</div>

			<PopupArrowSvg className={css.arrow} />
		</Popup>
	);
});
