// Пикселирует построчно.
// Проведена оптимизация кода.

(function() {
	var images = [
		{
			title: "title",
			x: 1415,
			y: 666,
			image: "http://i.imgur.com/image.png"
		}
	];

	function shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		while (0 !== currentIndex) {

			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

	images = shuffle(images);
  
	if (Notification.permission !== "granted")
		Notification.requestPermission();

	var om = App.socket.onmessage;

	App.socket.onmessage = function(message) {
		var m = JSON.parse(message.data);

		if(m.type == "captcha_required") {
			if (Notification.permission !== "granted")
				Notification.requestPermission();
			else {
				var notification = new Notification('Капчуй-капчуй', {
					body: "Введи капчу, уеба.",
				});
			}
		}

		om(message);
	}

	var Painter = function(config) {
		var board = document.getElementById("board").getContext('2d');
		var title = config.title || "unnamed";

		var img = new Image();
		img.crossOrigin = "anonymous";
		img.src = config.image;
		var x = +config.x;
		var y = +config.y;

		var canvas = document.createElement('canvas');
		var image;
		var image_pixels;
		var board_pixels;

		var image_loaded_flag = false;


		function isSamePixelColor(coords) {
			if(image_pixels[coords+3] <= 127)
				return true;

			for(var i = 0; i < 3; i++) {
				if(board_pixels[coords+i] != image_pixels[coords+i])
					return false;
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
			var w = canvas.width;
			var h = canvas.height;
			board_pixels = board.getImageData(x, y, w, h).data;
			for(var i = 0, len = board_pixels.length; i < len; i += 4) {
				
				var j = i; // cверху вниз
				//var j = len-4-i; // cнизу вверх
				//var j = (i/4%h*w+(i/4/h|0))*4; // слева направо
				//j = (j/4%h*w+(i/4/h|0))*4; // справа налево

				if(!isSamePixelColor(j)) {
					var _x = j/4%w;
					var _y = j/4/w|0;

					var color_id = getColorId(j);
					if(color_id < 0) {
						console.log("пиксель x:" + _x + " y: " + _y + " хуевый");
						continue;
					}

					App.switchColor(color_id);
					App.attemptPlace(x + _x, y + _y);

					console.log("рисую " + title + " пиксель " + " x:" + (x + _x) + " y:" + (y + _y));
					
					return 25;
				}
				
			}
			console.log(title + " охуенен");
			return -1;
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

		img.onload = function(){
			canvas.width = img.width;
			canvas.height = img.height;
			image = canvas.getContext('2d');
			image.drawImage(img, 0, 0, img.width, img.height);
			image_pixels = image.getImageData(0, 0, canvas.width, canvas.height).data;

			image_loaded_flag = true;
		};



		return {
			drawImage: drawImage,
			isReady: isReady
		}
	}


	var painters = [];
	for(var i = 0; i < images.length; i++) {
		painters[i] = Painter(images[i]);
	}

	function draw() {
		var timer = (App.cooldown-(new Date).getTime())/1000;
		if(0 < timer) {
			//console.log("timer: " + timer);
			setTimeout(draw, 1000);
		}
		else {
			for(var i = 0; i < painters.length; i++) {
				if(painters[i].isReady()) {
					var result = painters[i].drawImage();

					if(result > 0) {
						setTimeout(draw, result*1000);
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
})();
