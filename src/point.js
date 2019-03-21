export default class Point {
	constructor(x, y, {interpolated = false} = {}) {
		this.x = x;
		this.y = y;
		this.interpolated = interpolated;
	}
}
