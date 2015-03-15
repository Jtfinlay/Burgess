function LiveMap(idCanvas, theWidth, theHeight, img) {
	var self = this;
	this.id = idCanvas;
	this.width_m = theWidth;
	this.height_m = theHeight;
	this.img = img;
	this.customers = [];

	this.width_px = 600; this.height_px = 400;
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
		that = this;
		this.iBackground = new Image();
		this.iBackground.onload=function()
		{ that.draw(); };
		this.iBackground.src = this.img;
	},
	/*
	 *	Draw the customers on the screen, with differentiated priority.
	 *	Also scales the metric locations to pixel.
	 */
	draw:function () {
		var self = this;
		jc.start(this.id);
		jc.rect(0, 0, this.width_px, this.height_px, 'rgba(200, 200, 200, 1)', 1);
		jc.image(this.iBackground, 0, 0, this.width_px, this.height_px);

		$.each(this.customers, function(i, c)
		{
			var x = (c.x / self.width_m) * self.width_px;
			var y = (c.y / self.height_m) * self.height_px;
			var r = (c.radius / self.width_m) * self.width_px;
			if (c.employee) {
				jc.circle(x, y, r, 'rgba(0,0,150,0.25)', true);
				jc.rect(x-6, y-6, 12, 12, 'rgba(0,0,0,0.5', 1);
			} else {
				jc.circle(x, y, r, 'rgba('+(255*c.priority)+','+(255*(1-c.priority))+',0,0.25)', true);
				jc.circle(x, y, 6, 'rgba('+(255*c.priority)+',0,'+(255*(1-c.priority))+',0.5)', true);
			}
		});

		jc.start(this.id);
		this.customers = [];
	},
	/*
	 *	Add a customer to the array
	 */
	addCustomer:function (xi, yi, ri, pi, employee)
	{
		this.customers.push({x: xi, y: yi, radius: ri, priority: pi, employee: employee});
	}
}
