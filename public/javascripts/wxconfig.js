wx.config({
  debug: true,
  appId: 'wx1cb1b46245171b2e', // 必填，公众号的唯一标识
  timestamp: 1576661161, // 必填，生成签名的时间戳
  nonceStr: 'y4nc043efe', // 必填，生成签名的随机串
  signature: '61cff1c2162e37e575dd07ad930d319b9a8be41e',// 必填，签名
  jsApiList: ['updateAppMessageShareData'] // 必填，需要使用的JS接口列表
});