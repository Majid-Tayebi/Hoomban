export const NAVBAR_CONTEXT = Symbol('resizable-navbar');

export type NavbarContext = {
	/** Compact / scrolled navbar */
	visible: boolean;
	/** Navbar is shown (after hero) */
	revealed: boolean;
	/** Still over the hero image */
	onHero: boolean;
	heroTone: 'dark' | 'light';
};

export const DEFAULT_NAVBAR_CONTEXT: NavbarContext = {
	visible: false,
	revealed: false,
	onHero: true,
	heroTone: 'light'
};
