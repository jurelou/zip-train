const express = require('express')
const fs = require('fs');
const schedule = require('node-schedule')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const rimraf = require('rimraf');
const path = require('path')
const api = require('./api')
const log = require('./logger')
const app = express()


app.set('port', process.env.PORT || 4000)
app.set('view engine', 'pug')
app.set('views', path.resolve(__dirname, '../app'))

app.use(cookieParser());
app.use(session({	
    secret: '34SsdfDgsdfsdfzesdfsdfsdfrtqszeazesG',
    resave: false,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    if (!req.session.returning) {
		if (!fs.existsSync('./public/' + req.session.id)){
		    fs.mkdirSync('./public/' + req.session.id)
		}        
        req.session.returning = true
    }
    next()
})

app.use("/static", express.static(path.join(__dirname, "/../public/")));
console.log(path.join(__dirname, "/../public"))
app.use('/css', express.static(path.resolve(__dirname, '../app/assets/css')))
app.use('/dist', express.static(path.resolve(__dirname, '../app/dist')))
app.use('/js', express.static(path.resolve(__dirname, '../app/assets/js')))

app.use(api)


var j = schedule.scheduleJob('0 * * * *', function(){
	fs.readdir('./public/', (err, files) => {
  		files.forEach(file => {
    		fs.lstat('./public/' + file, (err, stat) => {
    			if (!err && stat.isDirectory)
					rimraf('./public/' + file + '/*', function(){})
    		})
  		});
	});	
});

var j = schedule.scheduleJob('0 1 * * *', function(){
	rimraf('./public/*', function () { console.log('done'); });
	rimraf('./public/.*', function () { console.log('done'); });
});



const server = app.listen(app.get('port'), () => {
  log.info(`Express server started on http://localhost:${server.address().port}`)
})

module.exports = server
