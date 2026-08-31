import type { GlobalSearchResult } from '$lib/search/services/global-search';

/** Shared dashboard header search — list pages read query; panel shows cross-panel results. */
class GlobalSearch {
	query = $state('');
	open = $state(false);
	results = $state<GlobalSearchResult[]>([]);
	loading = $state(false);

	clear() {
		this.query = '';
		this.results = [];
	}

	close() {
		this.open = false;
	}

	openPanel() {
		this.open = true;
	}

	setResults(results: GlobalSearchResult[]) {
		this.results = results;
	}

	setLoading(loading: boolean) {
		this.loading = loading;
	}
}

export const globalSearch = new GlobalSearch();
