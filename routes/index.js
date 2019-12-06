function routers(app) {
  app.get('/', function (req, res) {
    res.redirect('/home')
  })
  app.use('/users', require('./users'))
  app.use('/home', require('./home'))
  app.use('/wx', require('../config/wx/serverAuth'))
  app.use('/getName', require('../interface/getName'))
  // app.use('/recmsg', require('../common/recmsg'))

  app.post('/recmsg', function (req, res, next) {
    console.log('req.body: ',req.body);
    req.on('data', function(chunk) {
      console.log('111: ',req.body);
      req.rawBody += chunk;
    });
    req.on('end', function() {
      res.send(req.body);
    });
});

  /**
   * [404 page handle]
   * @param  {[type]} req  [requires]
   * @param  {[type]} res) { if (!res.headersSent) {res.status(404).render('404')    }  } [description]
   * @return {[type]}      [response]
   */
  app.use(function (req, res) {
    if (!res.headersSent) {
      res.status(404).render('404')
    }
  })
}

module.exports = routers;
