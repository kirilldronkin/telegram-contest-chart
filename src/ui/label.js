import {createDiv} from '../utils.js';

export default class Label {
	constructor(container) {
		this._container = container;

		this._setupDOM();
	}

	setTitle(title) {
		this._title.innerText = title;
	}

	setItems(items) {
		this._items.innerHTML = '';

		items.forEach(({title, value, color}) => {
			const itemElement = createDiv('label__item');
			const valueElement = createDiv('label__item-value');
			const titleElement = createDiv('label__item-title');

			itemElement.style.color = color;
			valueElement.innerText = value;
			titleElement.innerText = title;

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
