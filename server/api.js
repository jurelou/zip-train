const api = require('express').Router()
const formidable = require('formidable')
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const is_zip = require('is-zip-file');

api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next() 
})

api.get('/', (req, res) => {
  res.render('views/index')
})

api.get('/pictures', (req, res) => {
  console.log(req.session.id)
  const url = req.query.url ? './public/' + req.session.id + '/' + req.query.url : './public/' + req.session.id;  
  const relative = path.relative('./public/' + req.session.id, url);
  const isSubdir = /*relative &&*/ !relative.startsWith('..') /*&& !path.isAbsolute(relative)*/;
  let good_path = './public/' + req.session.id;
  let cont = true;
  try {
      stats = fs.lstatSync(url);
      if (stats.isDirectory() && isSubdir)  {
          good_path = url;
      } else if (stats.isFile() && isSubdir) {
        cont = false;


        fs.open(url, 'r', function(status, fd) {
            if (status) {
              res.send(status.message);
              res.end();
            }
            var buffer = new Buffer(500);
            fs.read(fd, buffer, 0, 500, 0, function(err, num) {
              res.send(buffer.toString('utf-8', 0, num));
              res.end();
            });
        });

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
      let tmp = url.match(new RegExp("public/" + req.session.id + "/(.*)" + file));
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
   res.render('views/files', {files: files, uid: req.session.id} )
   res.end()
  })
  }
})

api.post('/upload', (req, res) => {
  let nope = false
  console.log(req.query.level)
  var form = new formidable.IncomingForm()
  form.uploadDir= __dirname + '/../public/' + req.session.id + '/'
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
    
    form.on('error', function(err)  {
        error = true
    })
    form.on('aborted', function() {
      error = true
    });

    form.parse(req, function(err, fields, files) {    
      try {
        if (nope && fs.existsSync(files.avatea.path)) {
          fs.unlinkSync(files.avatea.path);
          console.log("Removed", files.avatea.path)
        }
      } catch(err) {
        error = true
      }

      is_zip.isZip(files.avatea.path, function(err, is) {
        if(err) {
          error = true
        } else if (is) {
          let cmd =  'unzip -o ' + files.avatea.path + ' -d ' + __dirname + '/../public/' + req.session.id + '/'
          exec(cmd , (err, stdout, stderr) => {
            if (err)
              error = true
            console.log(`UNZIP stdout: ${stdout}`);
            console.log(`UNZIP stderr: ${stderr}`);
          });
        }
        if (error)
          return res.redirect('/noob?s=err')
        else if (nope)
          return res.redirect('/' + req.query.level + '?s=nope')
        else
          return res.redirect('/' + req.query.level + '?s=ok')
        });
    })
})

api.get('/noob', (req, res) => {
  fs.readdir(__dirname + '/../public/' + req.session.id, function(error, data){
    if (req.query.s && req.query.s == "err"){
      return res.render("views/noob", {uid: req.session.id, files: data, error: "Oooopssss something went wrong ......."})
    }
    else if (req.query.s && req.query.s == "nope")
      return res.render("views/noob", {uid: req.session.id, files: data, nope: "nope :)"})
    else if (req.query.s && req.query.s == "ok")
      return res.render("views/noob", {uid: req.session.id, files: data, msg: "File successfully uploaded"})
    else
      return res.render("views/noob", {uid: req.session.id, files: data})
  });  
})

function noob(data, file){
  return false
}

api.get('*', (req, res) => {
  res.redirect('/');
})

module.exports = api
