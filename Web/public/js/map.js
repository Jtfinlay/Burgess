function LiveMap(idCanvas, theWidth, theHeight) {
	this.id = idCanvas;
	this.width = theWidth;
	this.height = theHeight;
	this.customers = [];
}

LiveMap.prototype = {
	constructor: LiveMap,
	// TODO Documentation
	loadResources:function () {
		that = this;
		this.iBackground = new Image();
		this.iBackground.onload=function()
		{ that.draw(); };
		this.iBackground.src = "/images/store_layout.png";
	},
	// TODO Documentation
	draw:function () {
		jc.start(this.id);	
		jc.rect(0, 0, this.width, this.height, 'rgba(200, 200, 200, 1)', 1);
		jc.image(this.iBackground, 0, 0, this.width, this.height);

		$.each(this.customers, function(i, c) 
		{
			jc.circle(c.x, c.y, c.radius, 'rgba(0,255,0,0.25)', true);
			jc.circle(c.x, c.y, 4, 'rgba(255,0,0,0.5)', true);
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
