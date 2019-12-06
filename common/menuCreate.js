let https = require('https');
let token = '28_dqgOE6bmoo10L8uRUdrmH_g7XXhB0q4HXzNC1uHOmKm2v51erNYmkWODdfEUxM7dc3_OxTCX5pgURiQhLGrh89G43wquxF9pH3o7QlcC9FXYy4pzeFz4mRCslrxp9f_EacqaCoANl-T5-d-nNRDjAEAAEQ';

let path = 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=' + token;
let postData =  {
    "button": [
        {
            "name": "扫码",
            "sub_button": [
                {
                    "type": "scancode_waitmsg",
                    "name": "扫码带提示",
                    "key": "rselfmenu_0_0",
                    "sub_button": [ ]
                },
                {
                    "type": "scancode_push",
                    "name": "扫码推事件",
                    "key": "rselfmenu_0_1",
                    "sub_button": [ ]
                }
            ]
        },
        // {
        //     "name": "发图",
        //     "sub_button": [
        //         {
        //             "type": "pic_sysphoto",
        //             "name": "系统拍照发图",
        //             "key": "rselfmenu_1_0",
        //             "sub_button": [{"type": "pic_sysphoto","name": "系统拍照发图","key": "rselfmenu_1_0"}]
        //          },
        //         {
        //             "type": "pic_photo_or_album",
        //             "name": "拍照或者相册发图",
        //             "key": "rselfmenu_1_1"
        //         },
        //         {
        //             "type": "pic_weixin",
        //             "name": "微信相册发图",
        //             "key": "rselfmenu_1_2",
        //             "sub_button": [ ]
        //         }
        //     ]
        // },
        // {
        //     "name": "发送位置",
        //     "type": "location_select",
        //     "key": "rselfmenu_2_0"
        // }
        // {
        //    "type": "media_id",
        //    "name": "图片",
        //    "media_id": "MEDIA_ID1"
        // },
        // {
        //    "type": "view_limited",
        //    "name": "图文消息",
        //    "media_id": "MEDIA_ID2"
        // }
    ]
}
 postData = JSON.stringify(postData);

let opt = {
	host: 'api.weixin.qq.com',
	path: path,
	method: 'POST',
    headers:{
        "Content-Type": "application/json;encoding=utf-8",
        "Content-Length": Buffer.byteLength(postData)
    }
}
let req = https.request(opt, function(res) {
    res.setEncoding('utf8');
    res.on('data',function(data){
    	data = JSON.parse(data);
    	if(data.errcode) { // 更新token及存储时间
    		console.log(data.errmsg);
    	} else {
    		console.log('meun create ' + data.errmsg);
    	}

    }).on('end', function(){
        console.log('request end!')
    });
}).on('error', function(e) {
    console.log("error: " + e.message);
})

req.write(postData);
req.end();