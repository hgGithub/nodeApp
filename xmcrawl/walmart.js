let Crawler = require('crawler');

/*
从指定网站爬取数据
 */
let walmart = (optFlag, getCurrentData) => {
	var desWeb = ['https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=1',
				'https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=2',
				'https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=3',
				'https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=4',
				'https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=5',
				'https://www.walmart.com/search/api/preso?cat_id=3944_3951_1089430_132960&prg=desktop&facet=condition%3ANew%7C%7Cretailer%3ALENOVO%7C%7Cretailer%3AVIPOUTLET%7C%7Cretailer%3AWalmart.com%7C%7Cretailer%3AASUS&page=6'];
	var	dwLength = desWeb.length;
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
				done();
			} else {
					let source = res.options.uri;
					let resJsonObj = JSON.parse(res.body); // 返回的JSON字符串转化为JSON对象
					if(!resJsonObj.status) {
						mlConfig.logger.info("爬虫结果错误");
						done();
						return;
					}

					let resProList = resJsonObj.items,
						resProListLength = resProList.length;
					
					if(!resProListLength) { // 爬到的数据为0时结束当前回调。
						done();
					}

					for(var i = 0; i < resProListLength; i++){
						let proDetail = resProList[i];
						let tNameList = []; // 0: 当前值， 1：产品名称， 2： 产品链接
						let name = proDetail.title.trim(),
							prdId =proDetail.productId.trim(),
							pLink = 'https://www.walmart.com' + proDetail.productPageUrl;

						// global.logger.info('当前商品： ', proDetail);
						var value = Math.floor(proDetail.primaryOffer.offerPrice);

						var Isinventory = proDetail.inventory ? (proDetail.inventory.displayFlags ? proDetail.inventory.displayFlags[0] : false) : false;

						if (!value || (Isinventory && Isinventory === 'OUT_OF_STOCK')) { // 如果没有显示价格或者脱销都不保存
							continue;
						}

						tNameList.push(value);
						tNameList.push(name);
						tNameList.push(pLink);

						laptop[prdId] = tNameList;
						// global.logger.info('当前价格： ', value, curDesCount, i, prdId);
					}

					if(curDesCount >= dwLength) {
						global.logger.info('walmart laptopCount: ', Object.keys(laptop).length);
						getCurrentData('walmart', laptop, optFlag);
					}

			}
			done();
			// connection.end();
		}
	});

	c.queue(desWeb);
}

module.exports = walmart;