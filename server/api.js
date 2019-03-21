const api = require('express').Router()
const formidable = require('formidable')
const fs = require('fs');
const path = require('path');



api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next() 
})

api.get('/', (req, res) => {
  res.render('views/index')
})



api.get('/pictures', (req, res) => {
  const url = req.query.url ? './public/pictures/' + req.query.url : './public/pictures';  
  const relative = path.relative('./public/pictures', url);
  const isSubdir = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  let good_path = './public/pictures';
  let cont = true;
  try {
      stats = fs.lstatSync(url);
      if (stats.isDirectory() && isSubdir)  {
          good_path = url;
      } else if (stats.isFile() && isSubdir) {
                  cont = false;
        fs.readFile(url, 'utf8', function(err, contents) {
          res.send(contents);
          res.end()});
      }
  }
  catch (e) {  }
  if (cont){
  let files  =  [{
    size : "-",
    time: "-",
    name: "..",
    uid: "-",
    gid: "-",
    type: "dir"
  }]
  fs.readdir(good_path, (err, item) => {
    item.forEach(file => {
      let url = __dirname + "/../" +good_path + "/"+file;
      var stat = fs.statSync(url)
      let tmp = url.match(new RegExp("public/pictures/" + "(.*)" + file));
      let p = "/"
      if (tmp && tmp[1])
        p = tmp[1]
      let obj = {
        size: stat.size,
        time: stat.birthtime,
        name: p+ file,
        uid: stat.uid,
        gid: stat.gid,
        type: "-",
        dir: p + "/"
      }
      obj.type = stat.isFile() ? "file" : obj.type;
      obj.type = stat.isDirectory() ? "dir" : obj.type;
      obj.type = stat.isSymbolicLink() ? "symlink" : obj.type;
      files.push(obj);
    });
   res.render('views/files', {files: files} )
   res.end()
  })
  }
})

api.get('/noob', (req, res) => {
fs.readdir(__dirname + '/../public/pictures', function(error, data){
  res.render('views/noob', {files: data})
});  
})

function noob(data, file){
  return false
}

api.post('/upload', (req, res) => {
  let nope = false

  var form = new formidable.IncomingForm()
  form.uploadDir= __dirname + '/../public/pictures/'
  form.keepExtensions= true
  let error = false


    form.on('file', function(a, b) {
      if (b.size == 0)
        error = true
    })

    form.on('fileBegin', function(data, file) {
      file.path = form.uploadDir + "/" + file.name;
      nope = noob(data, file)
    }) 
    
    form.on('end', function() {
    })
    
    form.on('error', function(err)  {
        error = true
    })
    
    form.on('aborted', function() {
      error = true
    });


    form.parse(req, function(err, fields, files) {
      console.log(fields, "jjjjjjjj", files.avatea)

      if (error)
        res.render("views/" + req.query.level, {error: "Oooopssss something went wrong ......."})
      else if (nope)
        res.render("views/" + req.query.level, {nope: "nope :)"})
      else
        res.render("views/" + req.query.level, {msg: "Files uploaded here"})
    })
  
})



api.get('*', (req, res) => {
  res.redirect('/');
})

module.exports = api
