import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

const doctors = await pb.collection('doctors').getList(1, 50, {
	filter: 'is_active = true',
	sort: 'sort_order'
});
const services = await pb.collection('services').getList(1, 50, {
	filter: 'is_active = true && price > 0',
	sort: 'sort_order'
});
const articles = await pb.collection('articles').getList(1, 50, {
	filter: 'is_published = true'
});
const testimonials = await pb.collection('testimonials').getList(1, 50, {
	filter: 'is_published = true'
});

console.log(
	'doctors',
	doctors.totalItems,
	doctors.items.map((d) => d.display_name).join(' | ')
);
console.log(
	'services',
	services.totalItems,
	services.items.map((s) => `${s.title}:${s.price}`).join(' | ')
);
console.log('articles', articles.totalItems);
console.log('testimonials', testimonials.totalItems);
console.log('OK');
