import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { generatePath } from 'react-router-dom';

import { ReactComponent as SearchSvg } from '../../../../icons/ic28/search.svg';
import { BlockchainProject, blockchainProjects } from '../../../../stores/blockchainProjects/blockchainProjects';
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
	const [results, setResults] = useState<BlockchainProject[]>([]);

	useEffect(() => {
		setResults(cleanTerm ? blockchainProjects.filter(p => p.name.toLowerCase().includes(cleanTerm)) : []);

		setPopupOpen(!!cleanTerm);
	}, [term]);

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
					onCloseRequest={() => setPopupOpen(false)}
				>
					<div className={css.content}>
						{results.length ? (
							<>
								<div className={css.heading}>Results</div>

								{results.map(project => {
									const href = generatePath(RoutePath.PROJECT_ID, { projectId: project.id });

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
											<span>{project.name}</span>
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
