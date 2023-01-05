import { useNavigate } from 'react-router-dom';

interface UseNavParameters {
	path?: string;
	search?: Record<string, string>;
}

export const useNav = () => {
	const navigate = useNavigate();

	return (value: string | UseNavParameters) => {
		const params: UseNavParameters = typeof value === 'string' ? { path: value } : value;

		navigate({
			pathname: params.path,
			search: params.search ? `?${new URLSearchParams(params.search).toString()}` : undefined,
		});
	};
};
