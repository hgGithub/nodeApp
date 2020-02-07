let Crawler = require('crawler');

/*
从指定网站爬取数据
 */
let samsclub = (optFlag, getCurrentData) => {
	var desWeb = ['https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&limit=48&searchCategoryId=1117&clubId=undefined&br=true', 'https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&offset=48&limit=48&searchCategoryId=1117&clubId=undefined&br=true'],
		dwLength = desWeb.length;
	var curDesCount = 0;
	var laptop = {};
	var c = new Crawler({
		maxConnections : 1,
		rateLimit: 3000,
		jQuery: false,
		callback: function (error, res, done) {
			curDesCount++;
			if(error) {
				global.logger.info("爬虫返回错误： ", error);
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

					if(!resProListLength) { // 防止设置爬的数量大于实际显示数量
						done();
						return;
					}

					for(var i = 0; i < resProListLength; i++){
						let proDetail = resProList[i];
						let tNameList = []; // 0: 当前值， 1：产品名称， 2： 产品链接
						let name = proDetail.productName.trim(),
							prdId =proDetail.productId.trim(),
						    pLink = '';

						let value = proDetail.onlinePricing ? (proDetail.onlinePricing.finalPrice ? (proDetail.onlinePricing.finalPrice.currencyAmount?
							Math.floor(proDetail.onlinePricing.finalPrice.currencyAmount):false):false):false;

						if (!value) continue;  // 如果获取不到价格则不更新此商品
						if(currentPage === 1) {
							pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 1);
						} else if(currentPage === 2) {
							pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 49);
						}

						tNameList.push(value);
						tNameList.push(name);
						tNameList.push(pLink);

						laptop[prdId] = tNameList;
					}

					if(curDesCount >= dwLength) {
						global.logger.info('samsclub laptopCount: ', Object.keys(laptop).length);
						getCurrentData('samsclub', laptop, optFlag);
					}

			}
			done();
			// connection.end();
		}
	});

	c.queue(desWeb);
}

module.exports = samsclub;