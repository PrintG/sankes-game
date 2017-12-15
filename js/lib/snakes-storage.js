window._storage = window.localStorage;
//如果没有该对象，则创建本地存储snakes对象
detect_storage();



//获取snakes对象字符串中的某个对象
/* 
	key -> 是个索引值 int 类型 (0-9)
*/
function snakes_getItem(key){
	var storage_snakes = snakes_getInfo()[0];
	return JSON.parse(storage_snakes[key]);
}
//修改/增加snakes对象字符串中的某个对象
/*
	key ->  	是个索引值 int 类型 (0-9)
	value -> 	要修改或增加的值, 一个数组, 格式:  ["昵称", 分数];
*/
function snakes_setItem(key,value){
	if(typeof value !== "object") return;
	var storage_snakes = snakes_getInfo()[0];
	storage_snakes[key] = value;
	_storage.setItem("snakes", JSON.stringify(storage_snakes));
}
//删除snakes对象字符串中的某个对象
/* 
	key -> 是个索引值 int 类型 (0-9)
*/
function snakes_delItem(key){
	var storage_snakes = snakes_getInfo()[0];
	storage_snakes.splice(key, 1);
	_storage.setItem("snakes", JSON.stringify(storage_snakes));
}
//获取snakes对象信息及长度
/*
	返回值: [snakes对象, snakes对象的长度]
*/
function snakes_getInfo(){
	detect_storage();
	var _o = JSON.parse(_storage.getItem("snakes")),
		_l = _o.length;
	return [_o,_l];
}
//遍历snakes对象
/*
	cb -> 回调函数
		-> 参数: 
			- key    键
			- value  值
	reverse -> 是否反过来遍历
*/
function snakes_each(cb, reverse){
	if(typeof cb === "function"){
		var _s = snakes_getInfo(),
			_l = [_s[1],_s = _s[0]][0],
			i;
		if(reverse){
			for(i = _l - 1; i >= 0; i--) cb(i, _s[i]);
		}else{
			for(i = 0; i < _l; i++) cb(i, _s[i]);
		}
	}
}
//检测是否存在snakes对象字符串,不存在自动补全
function detect_storage(){
	if(!_storage.getItem("snakes")){
		_storage.setItem("snakes","[]");
	}
}