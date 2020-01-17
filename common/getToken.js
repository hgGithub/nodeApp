let http = require('http');
let https = require('https');
let envId = require('../config/wx/envConfig');
let token = require('./token');
console.log('appid: ' + envId.appid);
let getAccessToken = () => {
	let curTimeStamp = Date.parse(new Date());
	if(token.token.timeStamp && token.token.timeStamp > curTimeStamp) {
		console.log(token.token.timeStamp + ' : ' + curTimeStamp);
		return true;
	}
	console.log('get token');
	// var data = {grant_type: 'client_credential', appid:envId.appid, secret:envId.appscret},
	// 	data = JSON.stringify(data);
	let path = 'https://api.weixin.qq.com/cgi-bin/token?';
	// console.log('data: ', data);
	let opt = {
		host: 'api.weixin.qq.com',
		port: 443,
		path: path + 'grant_type=client_credential&appid=' + envId.appid + '&secret=' + envId.appscret,
		method: 'GET'
	    // headers:{
	    //     "Content-Type": 'application/x-www-form-urlencoded'，
	    //     'Content-Length': Buffer.byteLength(postData)
	    // }
	}

	let resData = {};
	let req = https.request(opt, function(res) {
	    console.log("response: " + res.statusCode);
	    res.setEncoding('utf8');
	    res.on('data',function(data){
	    	data = JSON.parse(data);
	    	if(data.errcode) { // 更新token及存储时间
	    		console.log("data.errmsg: ", data.errmsg);
	    	} else {
	    		token.token.token = data.access_token;
	    		token.token.timeStamp = (Date.parse(new Date()) + 5400000);
	    		console.log('token: ', token.token.token, token.token.timeStamp);
	    		getApiTicket(token.token.token);
	    	}

	    }).on('end', function(){
	        console.log('request end!')
	    });
	}).on('error', function(e) {
	    console.log("error: " + e.message);
	})

	req.end();
}

let getApiTicket = (nowToken) => {
	let path = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + nowToken + '&type=jsapi';
	let opt = {
		host: 'api.weixin.qq.com',
		port: 443,
		path: path,
		method: 'GET'
	    // headers:{
	    //     "Content-Type": 'application/x-www-form-urlencoded'，
	    //     'Content-Length': Buffer.byteLength(postData)
	    // }
	}

	let resData = {};
	let req = https.request(opt, function(res) {
	    console.log("response: " + res.statusCode);
	    res.setEncoding('utf8');
	    res.on('data',function(data){
	    	data = JSON.parse(data);
	    	if(!data.errcode) { // success
	    		token.jsapiTicket.jsapiTicket = data.ticket;
	    		console.log('jsapiTicket: ' + data.ticket);
	    	} else {
	    		console.log(data.errmsg);
	    	}

	    }).on('end', function(){
	        console.log('api ticket request end!')
	    });
	}).on('error', function(e) {
	    console.log("api ticket request error: " + e.message);
	})

	req.end();
}

getAccessToken();