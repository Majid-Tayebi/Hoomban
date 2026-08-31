import { getContext, setContext } from 'svelte';

const SIDEBAR_KEY = Symbol.for('hoomban-sidebar');

export type SidebarContextValue = {
	get open(): boolean;
	setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
	get expanded(): boolean;
	setExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
	toggleExpanded: () => void;
	get animate(): boolean;
};

export function setSidebarContext(value: SidebarContextValue) {
	setContext(SIDEBAR_KEY, value);
}

export function useSidebar(): SidebarContextValue {
	const ctx = getContext<SidebarContextValue | undefined>(SIDEBAR_KEY);
	if (!ctx) {
		throw new Error('useSidebar must be used within a Sidebar provider');
	}
	return ctx;
}
