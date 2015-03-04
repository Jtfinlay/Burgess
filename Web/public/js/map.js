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
	// TODO Documentation
	loadResources:function () {
		that = this;
		this.iBackground = new Image();
		this.iBackground.onload=function()
		{ that.draw(); };
		this.iBackground.src = this.img;
	},
	// TODO Documentation
	draw:function () {
		var self = this;
		jc.start(this.id);	
		jc.rect(0, 0, this.width_px, this.height_px, 'rgba(200, 200, 200, 1)', 1);
		jc.image(this.iBackground, 0, 0, this.width_px, this.height_px);

		$.each(this.customers, function(i, c) 
		{
			console.log(c.x + "," + c.y)
			var x = (c.x / self.width_m) * self.width_px;
			var y = (c.y / self.height_m) * self.height_px;
			var r = (c.radius / self.width_m) * self.width_px;
			jc.circle(x, y, r, 'rgba(0,255,0,0.25)', true);
			jc.circle(x, y, 4, 'rgba(255,0,0,0.5)', true);
		});
		
		jc.start(this.id);
		this.customers = [];
	},
	// TODO Documentation, move coords to fit width/height
	addCustomer:function (xi, yi, ri) 
	{
		this.customers.push({x: xi, y: yi, radius: ri});
	}
}
