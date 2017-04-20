(function(images) {
	
	var Painter = function(config) {
		var board = document.getElementById("board").getContext('2d');
		var title = config.title || "unnamed";

		var img = new Image();
		img.crossOrigin = "anonymous";
		img.src = config.image;
		var x = +config.x;
		var y = +config.y;

		var m = +config.mode || 0;
		var w, h;

		var canvas = document.createElement('canvas');
		var image;
		var image_pixels;
		var board_pixels;

		var image_loaded_flag = false;
		var image_correct_flag = true;
		var contour_flag = false;


		function isSamePixelColor(coords) {
			if(image_pixels[coords+3] < 127)
				return true;

			for(var i = 0; i < 3; i++) {
				if(board_pixels[coords+i] != image_pixels[coords+i]) {
					if (m == 6) { // поиск контура
						if (
							coords/4%w%(w-1) == 0 || // возле границ картинки
							(coords/4/w|0)%(h-1) == 0 ||
							image_pixels[coords+3+4] < 127 || // возле прозрачных пикселей
							image_pixels[coords+3-4] < 127 ||
							image_pixels[coords+3+4*w] < 127 ||
							image_pixels[coords+3-4*w] < 127
							)
						{
							if (contour_flag)
								contour_flag = false; // приоритет - контур

							return false;
						}
						else if (contour_flag) {
							var flag = true;
							for(var j = 0; j < 3; j++) {
								if ( // дальнейший поиск пикселей возле контура
									board_pixels[coords+j+4] != image_pixels[coords+j+4] &&
									board_pixels[coords+j-4] != image_pixels[coords+j-4] &&
									board_pixels[coords+j+4*w] != image_pixels[coords+j+4*w] &&
									board_pixels[coords+j-4*w] != image_pixels[coords+j-4*w]
									)
								{
									flag = false;
									break;
								}
							}
							if (flag)
								return false;

							break;
						}
						else
							break;
					}
					else
						return false;
				}
			}
			return true;
		}

		function getColorId(coords) {
			var colors = [
				[255,255,255],
				[228,228,228],
				[136,136,136],
				[34,34,34],
				[255,167,209],
				[229,0,0],
				[229,149,0],
				[160,106,66],
				[229,217,0],
				[148,224,68],
				[2,190,1],
				[0,211,221],
				[0,131,199],
				[0,0,234],
				[207,110,228],
				[130,0,128]
			];

			var color_id = -1;
			var flag = false;
			for(var i = 0, len = colors.length; i < len; i++) {
				flag = true;
				for(var j = 0; j < 3; j++) {
					if(image_pixels[coords+j] != colors[i][j]) {
						flag = false;
						break;
					}
				}
				if(flag) {
					color_id = i;
					break;
				}
			}

			return color_id;
		}

		function tryToDraw() {
			var random_pixels = [];
			board_pixels = board.getImageData(x, y, w, h).data;
			
			if(+config.mode == 5) // смена режимов
				m = 5*Math.random()|0;

			for(var i = 0, len = board_pixels.length; i < len; i += 4) {
				
				var j = i;
				switch(m) {
					case 0: // cверху вниз
						//j = i;
						break;
					case 1: // cнизу вверх
						j = len-4-i;
						break;
					case 2: // слева направо
						j = (i/4%h*w+(i/4/h|0))*4;
						break;
					case 3: // справа налево
						j = len-4-i;
						j = (j/4%h*w+(j/4/h|0))*4;
						break;
				}

				if(!isSamePixelColor(j)) {
					if (m == 4 || m == 6)
						random_pixels.push(j);
					else
						return drawPixel(j);
				}	
			}

			if (random_pixels.length > 0) {
				var i = random_pixels[Math.random()*random_pixels.length|0];
				return drawPixel(i);
			}

			if (m == 6 && random_pixels.length == 0 && !contour_flag) {
				contour_flag = true;
				//console.log(title + " контур охуенен");
				return tryToDraw();
			}

			if (!image_correct_flag) {
				image_correct_flag = true;
				console.log(title + " охуенен");
			}
			return -1;
		}

		function drawPixel(i) {
			var _x = i/4%w;
			var _y = i/4/w|0;
			
			image_correct_flag = false;

			var color_id = getColorId(i);
			if(color_id < 0) {
				console.log("пиксель x:" + _x + " y: " + _y + " хуевый");
				return -1;
			}

			App.switchColor(color_id);
			App.attemptPlace(x + _x, y + _y);

			console.log("рисую " + title + " пиксель " + " x:" + (x + _x) + " y:" + (y + _y));
			return 1;
		}

		function drawImage() {
			if(image_loaded_flag) {
				return tryToDraw();
			}
			return -1;
		}

		function isReady() {
			return image_loaded_flag;
		}

		img.onload = function() {
			w = canvas.width = img.width;
			h = canvas.height = img.height;
			image = canvas.getContext('2d');
			image.drawImage(img, 0, 0, img.width, img.height);
			image_pixels = image.getImageData(0, 0, canvas.width, canvas.height).data;

			image_loaded_flag = true;
		}

		return {
			drawImage: drawImage,
			isReady: isReady,
		}
	}

	var painters = [];
	for(var i = 0; i < images.length; i++)
		painters[i] = Painter(images[i]);

	function draw() {
		if(0 < (App.cooldown-Date.now())/1000)
			setTimeout(draw, 100);
		else {
			for(var i = 0; i < painters.length; i++) {
				if(painters[i].isReady()) {
					if(painters[i].drawImage() > 0) {
						setTimeout(draw, 1000);
						return;
					}
					else
						continue;
				}
				else
					continue;
			}
			setTimeout(draw, 15000);
		}
		return;
	}

	draw();

})([
	{
		title: "title",
		x: 0,
		y: 0,
		image: "https://i.imgur.com/image.png",
		mode: 0, // 0 - построчно сверху, 1 - снизу, 2 - слева, 3 - справа, 4 - рандом,
		// 5 - рандомная смена режимов 0-4 на лету, 6 - рандомом от контура
	}
]);
