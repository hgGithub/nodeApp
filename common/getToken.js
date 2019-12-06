let http = require('http');
let https = require('https');
let envId = require('../config/wx/envConfig');
let token = require('./token');

let getAccessToken = () => {
	let curTimeStamp = new Date();
	if(token.timeStamp || token.timeStamp > curTimeStamp) {
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
	    		token.token = data.access_token;
	    		token.timeStamp = (Date.parse(new Date()) + 5400000);
	    		console.log(token.token, token.timeStamp);
	    	}

	    }).on('end', function(){
	        console.log('request end!')
	    });
	}).on('error', function(e) {
	    console.log("error: " + e.message);
	})

	req.end();
}

getAccessToken();