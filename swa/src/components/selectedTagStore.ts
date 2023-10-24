import { writable } from 'svelte/store';

export const selectedTag = writable('all');
export const searchTerm = writable('');