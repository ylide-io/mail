import { Helmet } from 'react-helmet';

interface PageMetaProps {
	title?: string;
	description?: string;
	image?: string;
}

export function PageMeta({ title, description, image }: PageMetaProps) {
	return (
		<Helmet>
			{title != null && <title>{title}</title>}

			{description != null && <meta name="description" content={description} />}

			{image != null && <meta property="og:image" content={image} />}
		</Helmet>
	);
}
