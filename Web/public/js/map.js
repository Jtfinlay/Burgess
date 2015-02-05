function LiveMap(idCanvas, theWidth, theHeight) {
	this.id = idCanvas;
	this.width = theWidth;
	this.height = theHeight;
	this.iBackground = {};
}

LiveMap.prototype = {
	constructor: LiveMap,
	// Documentation
	loadResources:function () {
		that = this;
		this.iBackground = new Image();
		this.iBackground.onload=function()
		{ that.draw(); };
		this.iBackground.src = "/images/store_layout.png";
	},
	getWidth:function () {
		return this.width;
	},
	// Documentation
	draw:function () {
		jc.start(this.id);	
		jc.rect(0, this.width, this.height, 'rgba(100, 100, 100, 1)', 1);
		jc.image(this.iBackground, 0, 0, this.width, this.height);
		jc.start(this.id);
	}
}
