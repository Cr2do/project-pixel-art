export interface Article {
	id: number;
	title: string;
	content: string;
	date: string;
}

const articles: Article[] = [
	{
		id: 1,
		title: 'Article 1',
		content: 'Lorem ipsum',
		date: (new Date()).toISOString(),
	},
	{
		id: 2,
		title: 'Article 2',
		content: 'Lorem ipsum',
		date: (new Date()).toISOString(),
	},
	{
		id: 3,
		title: 'Article 3',
		content: 'Lorem ipsum',
		date: (new Date()).toISOString(),
	},
	{
		id: 4,
		title: 'Article 4',
		content: 'Lorem ipsum',
		date: (new Date()).toISOString(),
	},
];

const save = (article: Article): Article[] => {
	articles.push({ ...article, date: (new Date()).toISOString() });
	return articles;
};

export { save, articles };
