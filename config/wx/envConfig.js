// 测试环境配置
const CUR_ENV = process.env.NODE_ENV || 'development';
const test_appid = 'wx1cb1b46245171b2e',
		test_appscret = 'aa7a181b07e0d748c68baa84119439dc';

const dev_appid = 'wx8aa796383a66c9aa',
		dev_appscret = '';

let appid, appscret;
if(CUR_ENV === 'development') {
	appid = test_appid;
	appscret = test_appscret;
} else {
	appid = dev_appid;
	appscret = dev_appscret;
}

module.exports = {
	appid,
	appscret
}
