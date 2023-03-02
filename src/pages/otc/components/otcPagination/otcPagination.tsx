import clsx from 'clsx';

import { useNav } from '../../../../utils/url';
import css from './otcPagination.module.scss';

export interface OtcPaginationProps {
	currentPage: number;
	totalPages: number;
	generateUrl: (forPage: number) => string;
}

export function OtcPagination({ currentPage, totalPages, generateUrl }: OtcPaginationProps) {
	const navigate = useNav();

	return (
		<>
			{totalPages > 1 && (
				<div className={css.root}>
					{currentPage > 1 && (
						<a
							href={generateUrl(currentPage - 1)}
							className={clsx(css.link, css.link_prev)}
							onClick={e => {
								e.preventDefault();
								navigate(generateUrl(currentPage - 1));
							}}
						>
							‹ Previous
						</a>
					)}

					{currentPage < totalPages && (
						<a
							href={generateUrl(currentPage + 1)}
							className={clsx(css.link, css.link_next)}
							onClick={e => {
								e.preventDefault();
								navigate(generateUrl(currentPage + 1));
							}}
						>
							Next ›
						</a>
					)}
				</div>
			)}
		</>
	);
}
