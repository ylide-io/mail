import React from 'react';

import { DEFAULT_PAGINATOR } from './constants';
import { IDebankProtocol, IProjectEntity, ITokenEntity, Paginator } from './types';

export const DataContext = React.createContext<{
	tokenQuery: string;
	nonPinnedTokenQuery: string;
	debankQuery: string;
	setTokenQuery: React.Dispatch<React.SetStateAction<string>>;
	setNonPinnedTokenQuery: React.Dispatch<React.SetStateAction<string>>;
	setDebankQuery: React.Dispatch<React.SetStateAction<string>>;
	fetchNonPinnedTokens: (page?: number) => void;
	tokens: Paginator<ITokenEntity>;
	nonPinnedTokens: Paginator<ITokenEntity | IDebankProtocol>;
	// selectedTokens: ITokenEntity[];
	// setSelectedTokens: React.Dispatch<React.SetStateAction<ITokenEntity[]>>;
	smartGuessToken: (id: string) => void;
	projectQuery: string;
	setProjectQuery: React.Dispatch<React.SetStateAction<string>>;
	fetchProjects: (page?: number) => void;
	projects: Paginator<IProjectEntity>;
	selectedProjects: IProjectEntity[];
	setSelectedProjects: React.Dispatch<React.SetStateAction<IProjectEntity[]>>;
	// setSelectedNonPinnedTokens: React.Dispatch<React.SetStateAction<ITokenEntity | IDebankProtocol[]>>;
	debankProtocols: Paginator<IDebankProtocol>;
	fetchDebankProtocols: (page?: number) => void;
	// selectedDebankProtocols: IDebankProtocol[];
	// setSelectedDebankProtocols: React.Dispatch<React.SetStateAction<IDebankProtocol[]>>;
	tokenIds: string[];
	setTokenIds: React.Dispatch<React.SetStateAction<string[]>>;
	fetchTokens: (page?: number) => void;
}>({
	tokenQuery: '',
	nonPinnedTokenQuery: '',
	setTokenQuery: () => {},
	setNonPinnedTokenQuery: () => {},
	fetchNonPinnedTokens: () => {},
	nonPinnedTokens: DEFAULT_PAGINATOR,
	// setSelectedNonPinnedTokens: () => {},
	// selectedTokens: [],
	// setSelectedTokens: () => {},
	smartGuessToken: () => {},
	projectQuery: '',
	setProjectQuery: () => {},
	fetchProjects: () => {},
	projects: DEFAULT_PAGINATOR,
	selectedProjects: [],
	setSelectedProjects: () => {},
	debankQuery: '',
	setDebankQuery: () => {},
	debankProtocols: DEFAULT_PAGINATOR,
	// selectedDebankProtocols: [],
	// setSelectedDebankProtocols: () => {},
	fetchDebankProtocols: () => {},
	tokenIds: [],
	setTokenIds: () => {},
	tokens: DEFAULT_PAGINATOR,
	fetchTokens: () => {},
});
