import { useNavigate } from 'react-router-dom';

export const useNav = () => {
	const navigate = useNavigate();

	const nav = (path: string) => {
		const dev = document.location.search.includes('dev=true');
		navigate({
			pathname: path,
			search: dev ? `?dev=${dev}` : '',
		});
	};

	return nav;
};
