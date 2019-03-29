const api = require('express').Router()
const formidable = require('formidable')
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const is_zip = require('is-zip-file');
const rimraf = require('rimraf');
var dialog = require('dialog-node');


api.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next() 
})


api.get('/remove', (req, res) => {
  rimraf('./public/' + req.session.id + '/*', function(){})
  res.redirect(req.get('referer'))
})

api.get('/pictures', (req, res) => {
  if (!fs.existsSync("./public/" + req.session.id))
    fs.mkdirSync("./public/" + req.session.id);
  const url = req.query.url ? './public/' + req.session.id + '/' + req.query.url : './public/' + req.session.id;  
  const relative = path.relative('./public/' + req.session.id, url);
  const isSubdir = /*relative &&*/ relative.indexOf("..") > -1 ? false: true/*&& !path.isAbsolute(relative)*/;
  let good_path = './public/' + req.session.id;
  let cont = true;
  try {
      stats = fs.lstatSync(url);
      if (stats.isSymbolicLink() && isSubdir)  {
        stats = fs.lstatSync(fs.realpathSync(url));
      }
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
  catch (e) {  console.log(e)}

  if (cont){
    let files  =  [{
      size : "-",
      time: "-",
      name: "..",
      uid: "-",
      gid: "-",
      type: "dir"
    }]
    try {
      fs.readdir(good_path, (err, item) => {
        item.forEach(file => {
          let url = __dirname + "/../" +good_path + "/"+file;
          try {
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
          } catch(e) {console.log("ERR674", e)}
        });
       res.render('views/files', {files: files, uid: req.session.id} )
       res.end()
      })
    }
    catch(e) {
      console.log("err121", e)
       res.end()
    }
  }
})

api.post('/upload', (req, res) => {
  let nope = false
  var form = new formidable.IncomingForm()
  form.uploadDir= __dirname + '/../public/' + req.session.id + '/'
  form.keepExtensions= true
  form.maxFieldsSize = 20 * 1024 * 1024;
  form.maxFileSize = 20 * 1024 * 1024;
  form.maxFields = 400;
  let error = false
 

    form.on('file', function(a, b) {
      /*if (b.size == 0)
        error = true*/
    })
    form.on('fileBegin', function(data, file) {
      if (!error) {
        file.path = form.uploadDir + "/" + file.name;
        console.log("UPLOAD level: ",req.query.level, " file:", file.path)
        if (req.query.level == "lamer") {
          nope = lamer(req, file)
          if (nope && file.name.indexOf('\0') > -1)
            file.name = file.name.substr(0, file.name.indexOf('\0'));
          console.log("@@@@", nope)
        }
        else if (req.query.level == "programmer")
          nope = programmer(req, file)
        else if (req.query.level == "noob")
          nope = false
        else if (req.query.level == "hacker")
          nope = hacker(req, file)
        else
          nope = true
      }
    })
    
    form.on('error', function(err)  {
        console.log("ERROR upload")
        error = true
    })
    form.on('aborted', function() {
      console.log("ABORTED upload")
      error = true
    });

    form.parse(req, function(err, fields, files) {
      if (error)
        return res.redirect('/' + req.query.level + '?s=err')
      try {
        if (nope && fs.existsSync(files.avatea.path)) {
          fs.unlinkSync(files.avatea.path);
          console.log("Removed", files.avatea.path)
          return res.redirect('/' + req.query.level + '?s=nope')
        }
        is_zip.isZip(files.avatea.path, function(err, is) {
          if(err) {
            console.log("Error isZip:", err)
            error = true
          } else if (is) {
            let cmd =  'unzip -o ' + files.avatea.path + ' -d ' + __dirname + '/../public/' + req.session.id + '/'
            console.log("EXEC")
            exec(cmd , (err, stdout, stderr) => {
              if (err)
                error = true
            });
          }
          if (error)
            return res.redirect('/' + req.query.level + '?s=err')
          else if (nope)
            return res.redirect('/' + req.query.level + '?s=nope')
          else
            return res.redirect('/' + req.query.level + '?s=ok')
          });

      } catch(err) {
        console.log("Error here123",err)
        error = true
      }
    })
})

function uploadPage(req, res, page) {
  fs.readdir(__dirname + '/../public/' + req.session.id, function(error, data){
    if (req.query.s && req.query.s == "err"){
      return res.render(page, {uid: req.session.id, files: data, error: "Oooopssss something went wrong ......."})
    }
    else if (req.query.s && req.query.s == "nope")
      return res.render(page, {uid: req.session.id, files: data, nope: "nope :)"})
    else if (req.query.s && req.query.s == "ok")
      return res.render(page, {uid: req.session.id, files: data, msg: "File successfully uploaded"})
    else if (req.query.s) {
      console.log("RENDER XSS level:", req.query.level,"with: ",req.query.s)
      return res.render(page, {uid: req.session.id, files: data, secureInput: req.query.s})
    }
    else
      return res.render(page, {uid: req.session.id, files: data})
  });  

}

api.get('/noob', (req, res) => {
  if (!fs.existsSync("./public/" + req.session.id))
    fs.mkdirSync("./public/" + req.session.id);
  return uploadPage(req, res, "views/noob")
})

api.get('/lamer', (req, res) => {
  if (!fs.existsSync("./public/" + req.session.id))
    fs.mkdirSync("./public/" + req.session.id);
  return uploadPage(req, res, "views/lamer") 
})

api.get('/programmer', (req, res) => {
  if (!fs.existsSync("./public/" + req.session.id))
    fs.mkdirSync("./public/" + req.session.id);
  if (req.query.s) {
    req.query.s = req.query.s.replace('<', '/')
    req.query.s = req.query.s.replace('>', '/')
    req.query.s = req.query.s.replace('&', '/')
    req.query.s = req.query.s.replace('"', '/')
    req.query.s = req.query.s.replace('=', '/')
    req.query.s = req.query.s.replace('(', '/')
  }
  return uploadPage(req, res, "views/programmer") 
})

api.get('/hacker', (req, res) => {
  if (!fs.existsSync("./public/" + req.session.id))
    fs.mkdirSync("./public/" + req.session.id);
  return uploadPage(req, res, "views/hacker") 
})

function lamer(req, file){
    const formats = [".png",
      ".jpeg",
      ".gif",
      ".jpg",
      ".bmp"];
  res = true
  formats.forEach(function(word) {
    if (file.name.endsWith(word))
      res = false
  })
  return res
}

function programmer(req,file){
    const formats = ["image/png",
      "image/jpeg",
      "image/gif",
      "image/bmp"];
    return formats.indexOf(file.type) == -1
}

function hacker(){
  return true
}

api.get('*', (req, res) => {
  res.redirect('/noob');
})

module.exports = api
