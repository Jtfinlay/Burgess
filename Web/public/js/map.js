/*
 *	Manages drawing and updating the LiveFeed to display positions in real time.
 */

function LiveMap(idCanvas, theWidth, theHeight, img) {
	var self = this;
	this.id = idCanvas;
	this.width_m = theWidth;
	this.height_m = theHeight;
	this.img = img;

	this.width_px = $("#"+this.id).width();
	this.height_px = $("#"+this.id).height();

	$("#"+this.id).attr('width', this.width_px);
	$("#"+this.id).attr('height', this.height_px);

	console.log(this.width_px);
	console.log(this.height_px);
	this.loadResources();

	/*$('<img src="'+self.img+'"/>').load(function() {
		self.width_px = this.width;
		self.height_px = this.height;
		self.loadResources();
	});*/

}

LiveMap.prototype = {
	constructor: LiveMap,
	/*
	 *	Load background image and any other resources.
	 */
	loadResources:function () {
		var self = this;
		this.iBackground = new Image();
		this.iBackground.onload=function() { self.draw(); };
		this.iBackground.src = this.img;
	},
	/*
	 *	Draw the customers & employees on the screen.
	 */
	draw:function (drawables) {
		var self = this;
		drawables = drawables || [];

		jc.start(this.id);

		jc.rect(0, 0, this.width_px, this.height_px, 'rgba(200, 200, 200, 1)', 1);
		jc.image(this.iBackground, 0, 0, this.width_px, this.height_px);

		$.each(drawables, function(i, c) {
			c.draw(self.width_m, self.width_px, self.height_m, self.height_px);
		});
		jc.start(this.id);
	}
}

