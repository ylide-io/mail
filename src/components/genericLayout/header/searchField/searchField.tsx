import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { ReactComponent as SearchSvg } from '../../../../icons/ic28/search.svg';
import { communities, Community } from '../../../../stores/communities/communities';
import { RoutePath } from '../../../../stores/routePath';
import { HorizontalAlignment } from '../../../../utils/alignment';
import { useNav } from '../../../../utils/url';
import { AnchoredPopup } from '../../../popup/anchoredPopup/anchoredPopup';
import { PropsWithClassName } from '../../../props';
import css from './searchField.module.scss';

export const SearchField = ({ className }: PropsWithClassName) => {
	const navigate = useNav();

	const inputRef = useRef(null);
	const [term, setTerm] = useState('');
	const cleanTerm = term.trim().toLowerCase();
	const [isFocused, setFocused] = useState(false);
	const [isPopupOpen, setPopupOpen] = useState(false);
	const [results, setResults] = useState<Community[]>([]);

	useEffect(() => {
		setResults(cleanTerm ? communities.filter(p => p.name.toLowerCase().includes(cleanTerm)) : []);

		setPopupOpen(!!cleanTerm);
	}, [cleanTerm]);

	useEffect(() => {
		setPopupOpen(prev => prev || (isFocused && !!cleanTerm));
	}, [cleanTerm, isFocused]);

	return (
		<div className={clsx(css.root, className)}>
			<SearchSvg />

			<input
				ref={inputRef}
				placeholder="Search"
				value={term}
				onChange={e => setTerm(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
			/>

			{isPopupOpen && (
				<AnchoredPopup
					className={css.popup}
					anchorRef={inputRef}
					horizontalAlign={HorizontalAlignment.MATCH}
					alignerOptions={{
						fitHeightToViewport: true,
					}}
					onCloseRequest={() => setPopupOpen(false)}
				>
					<div className={css.content}>
						{results.length ? (
							<>
								<div className={css.heading}>Results</div>

								{results.map(community => {
									const href = generatePath(RoutePath.PROJECT_ID, { projectId: community.id });

									return (
										<a
											className={css.item}
											href={href}
											onClick={e => {
												e.preventDefault();
												navigate(href);
												setPopupOpen(false);
											}}
										>
											<span>{community.name}</span>
										</a>
									);
								})}
							</>
						) : (
							<div className={css.noResults}>Nothing found</div>
						)}
					</div>
				</AnchoredPopup>
			)}
		</div>
	);
};
