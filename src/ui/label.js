import {createDiv} from '../utils.js';

export default class Label {
	constructor(container) {
		this._container = container;

		this._setupDOM();
	}

	setTitle(title) {
		this._title.textContent = title;
	}

	setItems(items) {
		while (this._items.firstChild) {
			this._items.removeChild(this._items.firstChild);
		}

		items.forEach(({title, value, color}) => {
			const itemElement = createDiv('label__item');
			const valueElement = createDiv('label__item-value', value);
			const titleElement = createDiv('label__item-title', title);

			itemElement.style.color = color;
			itemElement.appendChild(valueElement);
			itemElement.appendChild(titleElement);

			this._items.appendChild(itemElement);
		});
	}

	_setupDOM() {
		this._container.classList.add('label');

		this._title = createDiv('label__title');
		this._items = createDiv('label__items');

		this._container.appendChild(this._title);
		this._container.appendChild(this._items);
	}
}
