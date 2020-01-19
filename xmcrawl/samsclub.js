let Crawler = require('Crawler');

/*
从指定网站爬取数据
 */
let samsclub = (optFlag, getCurrentData) => {
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

						if(currentPage === 1) {
							pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 1);
						} else if(currentPage === 2) {
							pLink = 'https://www.samsclub.com' + proDetail.seoUrl + '?xid=plp_product_1_' + (i + 49);
						}

						tNameList.push(value);
						tNameList.push(pLink);

						laptop[name.trim()] = tNameList;
					}

					getCurrentData('samsclub', laptop, optFlag);
					global.logger.info('laptopCount: ', Object.keys(laptop).length);

			}
			done();
			// connection.end();
		}
	});

	c.queue(['https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&limit=48&searchCategoryId=1117&clubId=undefined&br=true', 'https://www.samsclub.com/api/node/vivaldi/v1/products/search/?sourceType=1&sortKey=relevance&sortOrder=1&offset=48&limit=48&searchCategoryId=1117&clubId=undefined&br=true']);
}

module.exports = samsclub;