let https = require('https');
let nodemailer = require("nodemailer");
let smtpTransport = require('nodemailer-smtp-transport');
let wellknown = require("nodemailer-wellknown");
let config = wellknown("QQ");
// let mysql = require('mysql');
let mysqlConnect = require('./config');
let samsclub = require('./samsclub');
let walmart = require('./walmart');
let timingTask = require('node-schedule');

// connect database:
var connection = null;

var dataBaseHandleError = (err) => {
	if (err) {
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            global.logger.error('db error执行重连:'+err.message);
            dataBaseLink();
        } else {
        	global.logger.error('数据库抛错误异常： '+err.message);
            throw err;
        }
	} else {
		global.logger.info("mysql 连接成功！");
	}

}

var dataBaseLink = () => {
	if (connection !== null) {
		connection.destroy();
		connection = null;
	}

	connection = mysqlConnect();
	connection.connect(dataBaseHandleError);
	connection.on('error', dataBaseHandleError);
}

var dataCrawl = (optFlag) => {
	// global.logger.info("数据库连接异步： ", connection.state);
	walmart(optFlag, getCurrentData);
	samsclub(optFlag, getCurrentData);
}

/*
格式化当前数据为Mysql datatime格式，插入数据库
 */
let getCurrentTime = () => {
	let newDate = new Date();
	Date.prototype.format = function(format) {
	       var date = {
	              "M+": this.getMonth() + 1,
	              "d+": this.getDate(),
	              "h+": this.getHours(),
	              "m+": this.getMinutes(),
	              "s+": this.getSeconds(),
	              "q+": Math.floor((this.getMonth() + 3) / 3),
	              "S+": this.getMilliseconds()
	       };
	       if (/(y+)/i.test(format)) {
	              format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
	       }
	       for (var k in date) {
	              if (new RegExp("(" + k + ")").test(format)) {
	                     format = format.replace(RegExp.$1, RegExp.$1.length == 1
	                            ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
	              }
	       }
	       return format;
	}

	return newDate.format('yyyy-MM-dd h:m:s');
}

/*
执行sql
 */
let searchRes = (string) => {
	connection.query(string, function (error, results, fields) {
	  if (error) {
	  	global.logger.error('当前数据库操作失败: ' + error);
	  	throw error;
	  }

	  if (results) {
		  if(string.indexOf('DELETE') != -1) {
			global.logger.info('mysql数据库delete操作成功');
		  } else if(string.indexOf('DUPLICATE') != -1){
		  	global.logger.info('mysql数据库insert/update操作成功');
		  } else {
		  	global.logger.info('mysql数据库insert操作成功');
		  }
	  }
	});
}

/*
source: 来自哪个网站
onLine： 目前线上爬出的数据
dbData：数据库里保存的数据
 */
let deleteOutOfStock = (source, onLine, dbData) => {
	let dbDataList = dbData,
		dbDataListKeys = Object.keys(dbDataList),
		dbDataListKeysLen = dbDataListKeys.length;

	let onLineList = onLine,
		onLineListKeys = Object.keys(onLineList),
		onLineListKeyslen = onLineListKeys.length;

	let offlineList = [];
	for (var i = 0; i < dbDataListKeysLen; i++) {
		let curProdCode = dbDataListKeys[i];
		if (onLineListKeys.indexOf(curProdCode) === -1) {
			offlineList.push(curProdCode);
		}
	}

	let offlineListLen = offlineList.length;
	let deleteStr ="DELETE from laptopsvalue WHERE SOURCE='" + source + "' AND PRODUCTCODE IN (";

	if (!offlineListLen) return;

	offlineList.forEach((item, index) => {
		if(index !== offlineListLen-1) {
			deleteStr += "'" + item + "',";
		} else {
			deleteStr += "'" + item + "')";
		}
	})

	global.logger.info('delete data: ', offlineList);
	searchRes(deleteStr);
}

/*optFlag: 标识数据是需要插入还是更新，第一爬需要手动插入，
其它时间有数据更新，没数据插头。
source： 网站标记，标记数据来源哪里？从哪里爬的。
 */
let updataData = (source, laptopObj, optFlag, dataList) => {
	let udataStr = "";
	let laptop = laptopObj;
	let prodCode = Object.keys(laptop), // 笔记本电脑名字
	 	length = prodCode.length;
	let udataList = dataList;

	if(optFlag === 'initInsert') {
		udataStr += "INSERT INTO laptopsvalue(SOURCE, NAME, CURRENTVALUE, PREVALUE, IFSENT, CURRENTDATE, LINK, PRODUCTCODE) VALUES ";
		prodCode.forEach((item, index) => {
			if (index) {
				udataStr += ",('" + source+ "','" + laptop[item][1] + "','" + laptop[item][0] + "','" + laptop[item][0] +"'," + "0,'" + getCurrentTime() + "','" + laptop[item][2] + "','"+ item +"')";
			} else {
				udataStr += "('" + source+ "','" + laptop[item][1] + "','" + laptop[item][0] + "','" + laptop[item][0] +"'," + "0,'" + getCurrentTime() + "','" + laptop[item][2] + "','"+ item +"')";
			}

		});

		searchRes(udataStr);
	} else {
		let keys = Object.keys(udataList),
		    keyLength = keys.length;

		keys.forEach((item, index) => {
			let str = "";
			str += "INSERT INTO laptopsvalue(SOURCE, NAME, CURRENTVALUE, PREVALUE, IFSENT, CURRENTDATE, LINK, PRODUCTCODE) VALUES ('"
			+ source + "', '" + udataList[item][4] + "', '" + udataList[item][0] + "','" + udataList[item][1] + "', 0, '"
			+ udataList[item][2] + "', '"+ udataList[item][3] +"','"+ item +"') ON DUPLICATE KEY UPDATE CURRENTVALUE='" + udataList[item][0] + "', PREVALUE='"
			+ udataList[item][1] + "', CURRENTDATE='" + udataList[item][2] + "'";

			searchRes(str);
		});
	}
}

/*
计算当前价格是否有涨幅
 */
let compareValue = (source, laptop, optFlag, htyDb) => {
	if(optFlag === 'initInsert'){
		updataData(source, laptop, optFlag, {});
		return;
	}

	let laptopObj = laptop;
	let ltNameList = Object.keys(laptopObj), // 笔记本电脑名字
	 	length = ltNameList.length;

	// 邮件list
	let emailList = {'insert': [], 'upd': []}; // insert: 新增列表,upd: 降价列表； 0笔记本名字，1当前价格， 2历史价格， 3链接地址
	let dataChangeList = {}; // 临时缓存数据库变动数据，供后续一次性操作。

	let valueUp = htyDb; // 缓存目前数据库已有数据 结构{产品id：[数据当前值，数据库上一次值，上一次记录日期，产品名称]}
	for(var i = 0; i < length; i++ ){
		let lpCode = ltNameList[i],         // 当前笔记本
			lpValue = laptopObj[lpCode][0], // 笔记本当前价
			lpName = laptopObj[lpCode][1], //笔记本当前名称
			lpLink = laptopObj[lpCode][2];  // 笔记本当前链接

		let tempEmailList = [];  // 邮件内容列表，0: 笔记本名字，1: 当前价， 2:历史价，3：商品链接

		if(!valueUp[lpCode]) { // 爬出的笔记本数据库没有记录
			tempEmailList[0] = lpValue;
			tempEmailList[1] = lpValue;
			tempEmailList[2] = getCurrentTime();
			tempEmailList[3] = lpLink;
			tempEmailList[4] = lpName;

			dataChangeList[lpCode] = tempEmailList; // 缓存要插入的数据
			emailList['insert'].push([lpCode, lpValue, lpValue, lpLink, lpName]);
		} else {
			if (lpValue !== valueUp[lpCode][0]) { // 当前价格比上一次价格低
				valueUp[lpCode][1] = valueUp[lpCode][0];    // 已存在笔记本的历史价
				valueUp[lpCode][0] = lpValue;				// 已存在笔记本的当前价

				// 配置价格波动列表
				tempEmailList[0] = lpCode;
				tempEmailList[1] = lpValue;
				tempEmailList[2] = valueUp[lpCode][1];
				tempEmailList[3] = lpLink;
				tempEmailList[4] = lpName;

				dataChangeList[lpCode] = [lpValue, tempEmailList[2], getCurrentTime(), lpLink, lpName]; // 缓存更新的数据
			}

			if (tempEmailList.length && lpValue < valueUp[lpCode][1]) { // 价格变动且降价发邮件
				emailList['upd'].push(tempEmailList);
			};

		}
	}

	global.logger.info('emailList: ', emailList);
	global.logger.info('dataChangeList: ', dataChangeList);

	let dclLength = Object.keys(dataChangeList).length;
	let elLength = emailList['insert'].length || emailList['upd'].length;

	if(dclLength) {
		updataData(source, laptop, optFlag, dataChangeList);
	}

	if(elLength) {
		sentMail(emailList, source); //发送email有差价数据
	} else {
		global.logger.info('本次数据无更新 ', new Date().toLocaleString());
	}

}

let getCurrentData = (source, laptop, optFlag) => {
	if (optFlag === 'initInsert'){
		compareValue(source, laptop, optFlag, {});
		return;
	}

	let dataSet = {};
	let sltSql = "SELECT * from laptopsvalue where SOURCE='" + source + "'";
	connection.query(sltSql, function (error, results, fields) {
	  if (error) return {code: 0, errMsg: error};
	  let currentRes = results;
	  let length = currentRes.length;
	  
	  for(var i = 0; i < length; i++) {
	  	let laptopName = currentRes[i];
	  	let laptopValue = [];
	  	laptopValue[0] = laptopName.CURRENTVALUE;
	  	laptopValue[1] = laptopName.PREVALUE;
	  	laptopValue[2] = laptopName.CURRENTDATE;
	  	laptopValue[3] = laptopName.NAME;
	  	dataSet[laptopName.PRODUCTCODE] = laptopValue;
	  }

	  compareValue(source, laptop, optFlag, dataSet);

		// 删除数据库中目前线上以下架的产品
		deleteOutOfStock(source, laptop, dataSet);

	  // return dataSet;
	});
}

/*
发送邮件
 */
let sentMail = (sendData, source) => {
	let sendObj = sendData,
		newAddList = sendObj['insert'],
	    newAddLength = newAddList.length,
	    lowList = sendObj['upd'],
	    lowLength = lowList.length;

	var sendStr = "夏末您好！";

	if(lowLength) {
		sendStr += "<h3>降价列表：</h3>";
		for(var i = 0; i < lowLength; i++){
			sendStr += "<p>  <a style='text-decoration:none;' target='_blank' href="+ lowList[i][3] +">" + lowList[i][4] + "</a>: 由原来-<b style='color: red'>$" + lowList[i][2] + ".00</b>, 降价为目前-<b style='color: red'>$" + lowList[i][1] + ".00</b></p>";
		}
	}

	if(newAddLength) {
		sendStr += "<h3>新增商品：</h3>";
		for(var i = 0; i < newAddLength; i++) {
			sendStr  += "<p> <a style='text-decoration:none;' target='_blank' href=" + newAddList[i][3] + ">"+ newAddList[i][4] +"</a>: 当前价格为<b style='color: red'>$" + newAddList[i][1] + ".00</b></p>";
		}
	}

	// if(source.indexOf('samsclub') != -1) {
	// 	sendStr += "请您关注，数据来源于https://www.samsclub.com/b/laptops/1117?xid=cat1116-comp_subcat_1_1"
	// } else {

	// }

	config.auth = {
	    user:'2201443105@qq.com',
	    pass:'axpszthzgcghdhjg'
	}
	let transporter = nodemailer.createTransport(smtpTransport(config));

	let mailOptions = {
	  from: '胡刚 <2201443105@qq.com>', // sender address
	  to: '2201443105@qq.com,Chenlayamazon1@gmail.com', // list of receivers,Chenlayamazon1@gmail.com
	  subject: '产品最新动态', // Subject line
	  // 发送text或者html格式
	  // text: sendStr, // plain text body
	  html: sendStr // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
	  if (error) {
	    global.logger.info('Email sent failed: ', error)
	    throw error;
	  }

	  if (newAddLength || lowLength) {
	  	global.logger.info('Email sent successful!')
	  }
	  
	  // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
	});
}

/*
dataBaseLink();有数据基础上执行更新。
dataBaseLink("initInsert");第一次爬，执行插入。
 */


var init = () => {
	dataBaseLink();

	let checkDataLinkState = () => {
		setTimeout(() => {
			if(connection && connection.state === 'authenticated') {
				dataCrawl();
			} else {
				checkDataLinkState();
			}
		}, 1000);
	}

	checkDataLinkState();
	// dataBaseLink("initInsert");
	// getCurrentData();
	// getData('samsclub');
}

let env  = process.env.NODE_ENV || 'development';
if(env === 'production') {
	dataBaseLink();
} else {
	init();
}


/*
定时规则
 */
var rule = new timingTask.RecurrenceRule();
rule.hour = [2, 4, 6, 8, 10, 12, 15, 17, 19, 21, 23];
rule.minute = 0;
rule.second = 0;

var timingObj = timingTask.scheduleJob(rule, function(){
  dataCrawl();
});
