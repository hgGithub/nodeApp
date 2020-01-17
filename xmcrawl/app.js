let https = require('https');
let Crawler = require('Crawler');
let nodemailer = require("nodemailer");
let smtpTransport = require('nodemailer-smtp-transport');
let wellknown = require("nodemailer-wellknown");
let config = wellknown("QQ");
// let mysql = require('mysql');
let mlConfig = require('./config');

// connect database:
var connection = null;
let dataBaseLink = (optFlag) => {
	connection = mlConfig.creatConnect();

	connection.connect((err) => {
		if(err) throw err;
		mlConfig.logger.info("mysql 连接成功！");
		getData(optFlag);
	});
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
	  	mlConfig.logger.error('error: ' + error);
	  	throw error;
	  }

	  mlConfig.logger.info('mysql数据库操作成功');
	});
}

/*optFlag: 标识数据是需要插入还是更新，第一爬需要手动插入，
其它时间有数据更新，没数据插头。
source： 网站标记，标记数据来源哪里？从哪里爬的。
 */
let updataData = (source, laptopObj, optFlag, dataList) => {
	let udataStr = '';
	let laptop = laptopObj;
	let name = Object.keys(laptop), // 笔记本电脑名字
	 	length = name.length;
	let udataList = dataList;

	if(optFlag === 'initInsert') {
		udataStr += "INSERT INTO laptopsvalue(SOURCE, NAME, CURRENTVALUE, PREVALUE, IFSENT, CURRENTDATE, LINK) VALUES ";
		name.forEach((item, index) => {
			if (index) {
				udataStr += ",('" + source+ "','" + item + "','" + laptop[item][0] + "','" + laptop[item][0] +"'," + "0,'" + getCurrentTime() + "'," + laptop[item][1] + ")";
			} else {
				udataStr += "('" + source+ "','" + item + "','" + laptop[item][0] + "','" + laptop[item][0] +"'," + "0,'" + getCurrentTime() + "',"+ laptop[item][1] +")";
			}

		});

		searchRes(udataStr);
	} else {
		let keys = Object.keys(udataList),
		    keyLength = keys.length;

		keys.forEach((item, index) => {
			let str = "";
			str += "INSERT INTO laptopsvalue(SOURCE, NAME, CURRENTVALUE, PREVALUE, IFSENT, CURRENTDATE, LINK) VALUES ('"
			+ source + "', '" + item + "', '" + udataList[item][0] + "','" + udataList[item][1] + "', 0, '"
			+ udataList[item][2] + "', '"+ udataList[item][3] +"') ON DUPLICATE KEY UPDATE CURRENTVALUE='" + udataList[item][0] + "', PREVALUE='"
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

	let valueUp = htyDb; // 缓存目前数据库已有数据
	for(var i = 0; i < length; i++ ){
		let ltName = ltNameList[i],         // 当前笔记本
			lpValue = laptopObj[ltName][0], // 笔记本当前价
			lpLink = laptopObj[ltName][1];  // 笔记本当前链接

		let tempEmailList = [];  // 邮件内容列表，0: 笔记本名字，1: 当前价， 2:历史价，3：商品链接

		if(!valueUp[ltName]) { // 爬出的笔记本数据库没有记录
			valueUp[ltName] = [];
			valueUp[ltName][0] = lpValue;
			valueUp[ltName][1] = lpValue;
			valueUp[ltName][2] = getCurrentTime();
			valueUp[ltName][3] = lpLink;

			dataChangeList[ltName] = valueUp[ltName]; // 缓存要插入的数据
			emailList['insert'].push([ltName, lpValue, lpValue, lpLink]);
		} else {
			if (lpValue < valueUp[ltName][0]) {
				valueUp[ltName][1] = valueUp[ltName][0];    // 已存在笔记本的历史价
				valueUp[ltName][0] = lpValue;				// 已存在笔记本的当前价

				// 配置价格波动列表
				tempEmailList[0] = ltName;
				tempEmailList[1] = lpValue;
				tempEmailList[2] = valueUp[ltName][1];
				tempEmailList[3] = lpLink;
			}

			if(tempEmailList.length) {
				dataChangeList[ltName] = [lpValue, tempEmailList[2], getCurrentTime(), lpLink]; // 缓存更新的数据
				emailList['upd'].push(tempEmailList);
			}
		}
	}

	mlConfig.logger.info('emailList: ', emailList);
	mlConfig.logger.info('dataChangeList: ', dataChangeList);

	let dclLength = Object.keys(dataChangeList).length;
	let elLength = emailList['insert'].length || emailList['upd'].length;

	if(dclLength) {
		updataData(source, laptop, optFlag, dataChangeList);
	}

	if(elLength) {
		sentMail(emailList, source); //发送email有差价数据
	}

}

let getCurrentData = (source, laptop, optFlag) => {
	if (optFlag === 'initInsert'){
		compareValue(source, laptop, optFlag, {});
		return;
	}

	let dataSet = {};
	let sltSql = "SELECT * from laptopsvalue";
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
	  	dataSet[laptopName.NAME] = laptopValue;
	  }

	  compareValue(source, laptop, optFlag, dataSet);

	  // return dataSet;
	});
}


/*
从指定网站爬取数据
 */
let getData = (optFlag) => {
	var c = new Crawler({
		maxConnections : 1,
		jQuery: false,
		callback: function (error, res, done) {
			if(error) {
				console.log(error);
			} else {
					let source = res.options.uri;
					// let resultsOption = JSON.parse(res.body);
					// mlConfig.logger.info('resultsOption: ', resultsOption['payload']['records'][0]);
					// return ;
					let resJsonObj = JSON.parse(res.body); // 返回的JSON字符串转化为JSON对象
					if(!resJsonObj.status) {
						mlConfig.logger.info("爬虫结果错误");
						return;
					}

					let resProList = resJsonObj.payload.records,
						resProListLength = resProList.length;
					let currentPage = resJsonObj.payload.currentPage;

					let laptop = {};
					for(var i = 0; i < resProListLength; i++){
						let proDetail = resProList[i];
						let tNameList = [];
						let name = proDetail.productName,
						    value = Math.floor(proDetail.onlinePricing.finalPrice.currencyAmount),
						    pLink = '';
						if(source.indexOf('samsclub') != -1){
							if(currentPage === 1) {
								pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 1);
							} else if(currentPage === 2) {
								pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 49);
							}
						}


						tNameList.push(value);
						tNameList.push(pLink);

						laptop[name.trim()] = tNameList;
					}

	                if (source.indexOf('samsclub') != -1) {
						getCurrentData('samsclub', laptop, optFlag);
						mlConfig.logger.info('laptopCount: ', Object.keys(laptop).length);
	                } else {
	                	// 其他网站爬到的信息
	                }

			}
			done();
			// connection.end();
		}
	});

	c.queue(['https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&limit=48&searchCategoryId=1117&clubId=undefined&br=true', 'https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&offset=48&limit=48&searchCategoryId=1117&clubId=undefined&br=true']);
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
			sendStr += "<p>  <a style='text-decoration:none;' target='_blank' href="+ lowList[i][3] +">" + lowList[i][0] + "</a>: 由原来-<b style='color: red'>$" + lowList[i][2] + ".00</b>, 降价为目前-<b style='color: red'>$" + lowList[i][1] + ".00</b></p>";
		}
	}

	if(newAddLength) {
		sendStr += "<h3>新增商品：</h3>";
		for(var i = 0; i < newAddLength; i++) {
			sendStr  += "<p> <a style='text-decoration:none;' target='_blank' href=" + newAddList[i][3] + ">"+ newAddList[i][0] +"</a>: 当前价格为<b style='color: red'>$" + newAddList[i][1] + ".00</b></p>";
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
	  subject: '降价提醒', // Subject line
	  // 发送text或者html格式
	  // text: sendStr, // plain text body
	  html: sendStr // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
	  if (error) {
	    mlConfig.logger.info('Email sent failed: ', error)
	    throw error;
	  }
	  mlConfig.logger.info('Email sent successful!')
	  // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
	});
}

/*
dataBaseLink();有数据基础上执行更新。
dataBaseLink("initInsert");第一次爬，执行插入。
 */
let init = () => {
	dataBaseLink();
	// dataBaseLink("initInsert");
	// getCurrentData();
	// getData('samsclub');
}
// init();
var intercal = setInterval(() => {
	init();
}, 10800000)