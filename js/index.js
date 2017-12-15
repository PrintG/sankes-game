/*==============================*/
//     * author -> Print        //
//     * QQ -> 2662256509       //
/*=============================*/
//解决HTML5 requestAnimationFrame兼容
(function(win){
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !win.requestAnimationFrame; ++x) {
        win.requestAnimationFrame = win[vendors[x] + 'RequestAnimationFrame'];
        win.cancelAnimationFrame = win[vendors[x] + 'CancelAnimationFrame'] ||    // Webkit中此取消方法的名字变了
            win[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if(!win.requestAnimationFrame){
        win.requestAnimationFrame = function(fn){
            return setTimeout(fn,1000/60);
        }
    }
    if(!win.cancelAnimationFrame){
        win.cancelAnimationFrame = function(timer){
            clearTimeout(timer);
        }
    }
})(window);
(function(win,doc){

	var $main = $("#main"),   //容器
		$InitView = $main.find(".game-init-view"),		//初始界面
		$GameView = $main.find(".game-view"),	//游戏界面
		$GameViewScore = $GameView.find(".score-wrap .score"),	//显示分数的元素
		$InitViewMenuBtns = $InitView.find(".menu li"),	//按钮列表
		$Rankings = $main.find(".game-list-wrap"),	//排行榜
		$GameOper = $main.find(".game-oper"),	//游戏操作说明
		$GameAuthor = $main.find(".game-author"),	//游戏操作说明
		$RankingsBtn = $Rankings.find(".confirm-btn"),	//排行榜按钮
		$gameEnd = $main.find(".game-end"),	//游戏结束界面
		$gameGrade = $gameEnd.find("p .grade"),	//游戏结束界面分数显示
		$gameComments = $gameGrade.siblings(".comments"),	//游戏结束时的评价
		$getUserName = $gameEnd.find(".getUserName"),	//打破记录时显示的元素
		$getUserNameText = $getUserName.find("input[name=user]"),	//输入昵称的控件
		$submit = $gameEnd.find(".submit");		//提交记录控件

	//获取canvas对象
	var oCanvas = doc.getElementById("game-interface"),
		ctx, 
		canvasWidth = oCanvas.width, 
		canvasHeight = oCanvas.height;

	var skinNum = 1,	//当前皮肤编号
		skinMaxNum = 7, //编号最大值(7个皮肤)
		moveDir = 0,	//移动方向    0 -> 上  1 -> 右  2 -> 下  3 -> 左
		score_step = 10,	//吃中一个食物多少分
		score = 0,	//当前分数
		snakes = [], 	//储存蛇的节点信息   [[x,y],[x,y],...]
		snake_foot = [],	//储存蛇的食物的位置信息  [x,y]
		snake_move_timer = null;	//控制蛇移动的定时器

	//取随机皮肤
	skinNum = Math.floor(Math.random()*skinMaxNum+1);

	//标准线(个数)以及评语
	var comments_inner = [
		[0, "你这是...在挂机吧！"],
		[1, "你是故意的吧！"],
		[8, "继续，你是最胖的！"],
		[15, "一般般啦,加油！"],
		[25, "还可以哦！"],
		[40, "哎哟,不错哦！"],
		[50, "你(女朋友)真棒！！！咳咳..."],
		[100, "看来你是个有耐心的人"],
		[500, "你就是传说！"],
		[1000, "你无敌了！"],
		[2000, "你这是在开外挂吧！"],
	];
	var comments_inner_length = comments_inner.length;

	if(oCanvas.getContext){
		ctx = oCanvas.getContext("2d");
	}else{
		alert("您的浏览器版本较低，无法正常体验游戏，请更换或升级浏览器");
		return;
	}

	//初始界面按钮点击事件注册
	initGame();
	function initGame(){
		$InitViewMenuBtns.click(MenuBtnsClick);
		function MenuBtnsClick(){
			var cN = $(this).prop("class");	//当前被点击的按钮的类名
			switch(cN){
				case "start":
					//开始游戏
					SnakeStart();
					break;
				case "rankings":
					//排行榜
					setTimeout(function(){
						$Rankings.removeClass("hide");
					},500);
					break;
				case "oper":
					//操作说明
					setTimeout(function(){
						$GameOper.removeClass("hide");
					},500);
					break;
				case "author":
					//关于作者
					setTimeout(function(){
						$GameAuthor.removeClass("hide");
					},500);
					break;
			}
			$InitView.fadeOut(500);
			//点击之后解绑，防止点击开始游戏之后快速点击其他选项弹出其他界面
			$InitViewMenuBtns.off("click", MenuBtnsClick);
		}
	}

	//排行榜按钮点击事件
	$RankingsBtn.click(function(){
		$Rankings.addClass("hide");
		$InitView.delay(800).fadeIn(500);
		//重新为按钮注册点击事件
		initGame();
	});
	$(".game-prop-view .confirm-btn").click(function(){
		$(this).parent().addClass("hide");
		$InitView.delay(800).fadeIn(500);
		//重新为按钮注册点击事件
		initGame();
	});

	//提交记录事件
	$submit.click(function(){
		$gameEnd.hide();
		$InitView.fadeIn(500);

		//数据填入
		var isExceed = snakes_isExceed(),
			snakes_obj = snakes_getInfo()[0],
			name = $getUserNameText.val();

		name = (name===""?"无名氏":name);
		
		//判断排行榜是否满了
		if(snakes_getInfo()[1] === 10){
			//排行榜满了
			if(isExceed !== false){
				snakes_obj.splice(isExceed,0,[name,score]);
				snakes_obj.length = 10;
			}
		}else{
			//排行榜没满
			if(isExceed !== false){
				//超过了前面某一个数据
				snakes_obj.splice(isExceed,0,[name,score]);
			}else{
				snakes_obj.push([name,score]);
			}
		}
		_storage.snakes = JSON.stringify(snakes_obj);
		//清除数据
		score = 0;
		$getUserNameText.val("");
		$GameViewScore.text(score);

		//更新排行榜
		fillRankings();

		//重新开始生成初始菜单
		initGame();
	});
	//蛸蛺蛱蛶蛼//蛸蛺蛱蛶蛼//蛸蛺蛱蛶蛼//蛸蛺蛱蛶蛼

	//=================== 一些游戏函数 ===================//
	var x_count = 50,	//x轴格子数
		y_count = 50;   //y轴格子数

	//计算出xy轴格子的大小
	var x_size = canvasWidth/x_count,
		y_size = canvasHeight/x_count;

	//初始创建食物的位置
	snake_foot.push( Math.floor( Math.floor( Math.random() * x_count ) * x_size ) );
	snake_foot.push( Math.floor( Math.floor( Math.random() * y_count ) * y_size ) );

	

	//游戏开始函数
	function SnakeStart(){
		//显示游戏场景
		$GameView.show();

		//绘制游戏场景
		drawGameScene();

		//加载皮肤
		var oSkin = new Image(),
			oSkin_body,
			oSkin_foot;
		oSkin.src = "./img/skin/snake_skin"+skinNum+"_head.png";
		
		oSkin.onload = function(){
			oSkin_body = new Image();
			oSkin_body.src = "./img/skin/snake_skin"+skinNum+"_body.png";
			oSkin_body.onload = function(){
				//加载食物
				oSkin_foot = new Image();
				oSkin_foot.src = "./img/skin/snake_foot.png";
				oSkin_foot.onload = function(){
					//全部加载成功
					CreateSnake();
				};
				oSkin_foot.onerror = function(){
					Prop("加载食物贴图失败！请联系作者", true);
				};
			};
			oSkin_body.onerror = function(){
				Prop("加载皮肤身体部分出错！请联系作者", true);
			};
		};
		oSkin.onerror = function(){
			Prop("加载皮肤头部出错！请联系作者", true);
		};

		//加载皮肤完成之后生成蛇等操作函数
		function CreateSnake(){
			var initX = x_size*Math.floor(x_count/2),
				initY = y_size*Math.floor(y_count/2);

			//初始绘制蛇头和一个节点
			drawSkin(true,initX,initY, true);
			drawSkin(false,initX,initY+(y_size), true);
			drawSkin(false,initX,initY+(y_size)*2, true);
			//开歪瓜
			// for(var i = 3; i <= (x_count*y_count); i++){
			// 	drawSkin(false,initX,initY+(y_size)*i, true);
			// }

			//蛇移动
			clearInterval(snake_move_timer);
			snake_move_timer = setInterval(snankeMove,150);
			function snankeMove(){
				ctx.clearRect(0,0,canvasWidth,canvasHeight);
				snakeFoot(snake_foot[0],snake_foot[1]);
				//绘制游戏界面
				drawGameScene();
				var i, prev,
					snakes_length = snakes.length;
				for(i = snakes_length - 1; i >= 0; i--){
					if(i !== 0){
						prev = i - 1;
						drawSkin(false,snakes[prev][0],snakes[prev][1], false);
						snakes[i] = [snakes[prev][0],snakes[prev][1]];
					}
				}

				_x = snakes[0][0];
				_y = snakes[0][1];
				switch(moveDir){
					case 0:
						_y -= y_size;
						break;
					case 1:
						_x += x_size;
						break;
					case 2:
						_y += y_size;
						break;
					case 3:
						_x -= x_size;
						break;
				}
				snakes[0] = [Math.floor(_x), Math.floor(_y)];

				drawSkin(true,snakes[0][0],snakes[0][1], false);

				//判断是否吃到食物
				if(snakes[0][0] === snake_foot[0] && snakes[0][1] === snake_foot[1]){
					//更改食物的位置
					snake_foot = [
						Math.floor( Math.floor( Math.random() * x_count ) * x_size ),
						Math.floor( Math.floor( Math.random() * y_count ) * y_size )
					];

					snakeFoot(snake_foot[0],snake_foot[1]);

					var last_snake = snakes[snakes_length-1];
						pushX = last_snake[0],
						pushY = last_snake[1];

					//根据移动的方向来确定添加的位置,在最后的一个元素的基础上增加
					switch(moveDir){
						case 0:
							//上
							pushY += y_size;
							break;
						case 1:
							//右
							pushX -= x_size;
							break;
						case 2:
							//下
							pushY -= y_size;
							break;
						case 3:
							//左
							pushX += x_size;
							break;
					}
					//在蛇尾部添加一个小球
					drawSkin(false,pushX,pushY, true);
					//播放音乐
					setBGM("./source/eat_foot.mp3");
					//增加分数
					score += score_step;
					$GameViewScore.text(score);
				}

				//判断是否吃到自己尾巴
				var isDie = false;
				for(var i = 1; i < snakes_length; i++){
					if(snakes[0][0] === snakes[i][0] && snakes[0][1] === snakes[i][1]){
						isDie = true;
						break;
					}
				}
				//判断是否撞墙
				if(snakes[0][0] > 600 || snakes[0][0] < 0 || snakes[0][1] > 600 || snakes[0][1] < 0){
					isDie = true;
				}

				//如果吃到了尾巴或者撞墙则游戏结束
				if(isDie){
					//播放音乐
					setBGM("./source/die.mp3");
					SnakeEnd();
				}

				//键盘控制操作方向
				doc.addEventListener("keydown", operMoveDir, false);

				function operMoveDir(e){
					e = e || window.event;
					var keyCode = e.keyCode;
					//往上走时，不能往下走
					if( (keyCode === 87 || keyCode === 38) && moveDir !== 2){
						moveDir = 0;
					}
					//往下走时，不能往上走
					if( (keyCode === 83 || keyCode === 40) && moveDir !== 0){
						moveDir = 2;
					}
					//往右走时，不能往左走
					if( (keyCode === 68 || keyCode === 39) && moveDir !== 3){
						moveDir = 1;
					}
					//往左走时，不能往右走
					if( (keyCode === 65 || keyCode === 37) && moveDir !== 1){
						moveDir = 3;
					}
					doc.removeEventListener("keydown", operMoveDir);
				}


			}
			//生成食物
			function snakeFoot(posX,posY){
				
				//防止食物重复在蛇节点位置
				clearRepeat();
				function clearRepeat(){
					var snakes_length = snakes.length;
					for(var i = 0; i < snakes_length; i++){
						if(snakes[i][0] === posX && snakes[i][1] === posY){
							//重新取值
							posX = Math.floor( Math.random() * x_count ) * x_size;
							posY = Math.floor( Math.random() * y_count ) * y_size;
							snake_foot = [posX,posY];
							clearRepeat();
						}
					}
				}
				ctx.drawImage(oSkin_foot, posX, posY, x_size, y_size);
			}
			//播放音乐
			function setBGM(src){
				var oAudio = document.createElement("audio");
				oAudio.src = src;
				oAudio.autoplay = true; 
			}


			//绘制皮肤
			/*
			*   isHeader -> 绘制皮肤的部位  头部(true) 身体(false)
			*   x y      -> 绘制的坐标
			*   isPush   -> 是否添加到snake数组中
			*/
			function drawSkin(isHeader,x,y,isPush){
				x = Math.floor(x);
				y = Math.floor(y);

				ctx.drawImage(isHeader?oSkin:oSkin_body, x, y, x_size, y_size);
				if(isPush){
					snakes.push([x,y]);
				}
			}

		}
	}

	//游戏结束函数
	function SnakeEnd(){
		//吃到食物的个数
		var score_num = Math.floor(score/score_step),
			comments = "额...不知道该说些什么好";

		clearInterval(snake_move_timer);	//关闭定时器
		ctx.clearRect(0,0,canvasWidth,canvasHeight);	//清空画布
		$GameView.hide();	//隐藏游戏界面
		$gameEnd.show();	//显示结束界面

		snakes = [];	//清空节点
		moveDir = 0;	//重置移动方向
		$gameGrade.text(score+"(长度: "+score_num+" )");	//在游戏结束界面显示分数

		//游戏结束根据分数写评价
		for(var i = 0; i < comments_inner_length; i++){
			if(score_num >= comments_inner[i][0]){
				comments = comments_inner[i][1];
			}
		}
		//如果排行榜已经满了
		if(snakes_getInfo()[1] === 10){
			//判断排行是否超越或打平了前十名
			snakes_isExceed() !== false?$getUserName.show():$getUserName.hide();
		}else{
			//排行榜没满
			$getUserName.show();
		}
		

		$gameComments.text(comments);
		
	}
	
	//绘制游戏场景函数
	function drawGameScene(){
		//绘制线条
		for(var i = 1; i < x_count; i ++){
			ctx.beginPath();
			ctx.moveTo(i*x_size,0);
			ctx.lineTo(i*x_size,canvasHeight);
			ctx.closePath();
			ctx.strokeStyle = "#ddd";
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(0,i*y_size);
			ctx.lineTo(canvasWidth,i*y_size);
			ctx.closePath();
			ctx.strokeStyle = "#ddd";
			ctx.stroke();
		}
	}

	//填充排行榜
	fillRankings();
	function fillRankings(){
		var inner = "";
		$rankings = $Rankings.find(".game-rankings tbody");
		
		snakes_each(function(k,v){
			inner += "<tr>"+
						 "<td>"+(k+1)+"</td>"+
						 "<td>"+v[0]+"</td>"+
						 "<td>"+v[1]+"</td>"+
					 "</tr>";
		});
		$rankings.html(inner);
	}

	//检测当前分数是否超过了排行榜中的某一个分数
	/*
		返回值: 布尔值  0-9(超过的索引值)  false(未超过)
	*/
	function snakes_isExceed(){
		var exceed = false;
		//判断排行是否超越或打平了前十名
		snakes_each(function(k, v){
			if(score >= v[1]){
				exceed = k;
			}
		}, true);
		return exceed;
	}

	//弹窗
	//  content -> string  -> 内容
	//  isShow  -> boolean -> 显示或隐藏
	//  isHide  -> boolean -> 是否在1s后消失
	function Prop(content, isShow, isHide){
		var $prop = $(".prop");
		$prop.text(content);
		isShow?$prop.fadeIn():$prop.fadeOut();
		isHide?$prop.delay(1000).fadeOut():"";
	}

	//---------------- 针对该游戏本地储存的操作 ---------------//
	/*
		- emmm... 存储在 window.localStorage 对象中的 snakes 属性中, 是个字符串
		- 格式:
		   "[
			    ["name","score"],["name","score"],...
			]"
	*/
	
})(window, document);