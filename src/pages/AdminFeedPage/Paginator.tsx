import { Button } from './Button';
import { Paginator } from './types';

type Props = {
	p: Paginator<any>;
	updatePage: (page: number) => void;
};

export const PaginatorComponent = ({ p, updatePage }: Props) => {
	return (
		<div>
			<Button
				disabled={p.currentPage === 1 || p.totalPages === 1}
				onClick={() => updatePage(p.currentPage - 1)}
				text={'prev page'}
			/>
			<Button
				disabled={p.currentPage === p.totalPages || p.totalPages === 1}
				onClick={() => updatePage(p.currentPage + 1)}
				text={'next page'}
			/>
			<span>
				Pages: {p.currentPage} / {p.totalPages}
			</span>
		</div>
	);
};
