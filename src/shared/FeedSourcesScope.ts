export class BaseFeedProject {
	readonly id: number;

	constructor(id: number) {
		this.id = id;
	}
}

export class BaseFeedSource {
	readonly id: number;
	readonly projectId: number | null;

	constructor(id: number, projectId: number | null) {
		this.id = id;
		this.projectId = projectId;
	}
}

export class FeedSourcesScope<TProject extends BaseFeedProject, TSource extends BaseFeedSource> {
	projectsMap: Map<number, TProject> = new Map();
	projectsArray: TProject[] = [];

	sourcesMap: Map<number, TSource> = new Map();
	sourcesArray: TSource[] = [];

	sourcesByProjectId: Map<number | null, TSource[]> = new Map();

	updateSources(sources: TSource[]) {
		this.sourcesArray = sources;
		this.sourcesMap.clear();
		this.sourcesByProjectId.clear();

		sources.forEach(source => {
			this.sourcesMap.set(source.id, source);
			const arr = this.sourcesByProjectId.get(source.projectId);
			if (arr) {
				arr.push(source);
			} else {
				this.sourcesByProjectId.set(source.projectId, [source]);
			}
		});
	}

	updateProjects(projects: TProject[]) {
		this.projectsArray = projects;
		this.projectsMap.clear();
		for (const project of projects) {
			this.projectsMap.set(project.id, project);
		}
	}

	updateProjectsAndSources(projects: TProject[], sources: TSource[]) {
		this.updateProjects(projects);
		this.updateSources(sources);
	}
}
