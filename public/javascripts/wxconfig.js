wx.config({
  debug: true,
  appId: 'wx1cb1b46245171b2e', // 必填，公众号的唯一标识
  timestamp: 1576735499, // 必填，生成签名的时间戳
  nonceStr: 'fzxwg6lzbg', // 必填，生成签名的随机串
  signature: '40f650a42e78c4cacb6b27714ea57f5f0dc623d5',// 必填，签名
  jsApiList: ['updateAppMessageShareData'], // 必填，需要使用的JS接口列表
  success: function (data) {
  	alert('config: ', data);
  }
});