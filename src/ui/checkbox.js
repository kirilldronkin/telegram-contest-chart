import {noop, createDiv} from '../utils.js';

export default class Checkbox {
	constructor(container, name, color, checked = true) {
		this._container = container;
		this._name = name;
		this._color = color;
		this._checked = checked;
		this._updateListener = noop;

		this._setupDOM();
		this._listenDOMEvents();

		this._renderCheckedState();
	}

	setUpdateListener(listener) {
		this._updateListener = listener;
	}

	isChecked() {
		return this._checked;
	}

	_setupDOM() {
		this._container.classList.add('checkbox');

		this._icon = createDiv('checkbox__icon');
		this._icon.style.borderColor = this._color;
		this._icon.appendChild(createDiv('checkbox__mark'));

		const text = createDiv('checkbox__text');
		text.innerText = this._name;

		this._container.appendChild(this._icon);
		this._container.appendChild(text);
	}

	_listenDOMEvents() {
		this._icon.addEventListener('click', () => {
			this._checked = !this._checked;
			this._renderCheckedState();

			this._updateListener();
		});
	}

	_renderCheckedState() {
		this._container.classList.toggle('_checked', this._checked);
		this._container.classList.toggle('_unchecked', !this._checked);
	}
}
