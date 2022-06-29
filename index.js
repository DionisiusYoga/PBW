const express = require("express")
const app = express()
const mysql = require("mysql")
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('connect-flash');
const fs = require('fs')
const PDFDocument = require('pdfkit-table')


var doc = new PDFDocument({ margin: 30, size: 'A4' });
doc.pipe(fs.createWriteStream("./Report.pdf"));

const dbConnect = () => {
    return new Promise((resolve,reject) => {
        pool.getConnection((err,conn) => {
            if(err){
                reject(err);
            }
            else{
                resolve(conn);
                
            }
        })
    })
}
const pool = mysql.createPool({
    host:'127.0.0.1',
    user:'root',
    password:'',
    database:'tugasbesar'
})

const getUser = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT * FROM users', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getUserPost= (conn,userID)=>{
    return new Promise((resolve,reject)=>{
        conn.query(`SELECT * FROM thread WHERE author_id = ${userID}`, (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}

const getPost = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT * FROM thread', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getCategory = conn => {
    return new Promise((resolve,reject) => {
        conn.query('SELECT name FROM thread_categories',(err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getTaggedPost = (conn,tagId) => {
    return new Promise((resolve,reject)=>{
        conn.query(`SELECT * FROM thread WHERE category_id = ${tagId}`,(err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}


const signup= (conn,username,password,email,fullname,date) =>{
    return new Promise((resolve,reject)=>{
        conn.query('INSERT INTO users (name,nickname,email,pass,role,joined_date,status) VALUES ("'%{fullname}% '", "'%{username}% '", "'%{email}%'","'%{password}%'","user","'%{date}%'","normal")', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const insertUser= (conn,data)=>{
    return new Promise((resolve,reject) => {
        conn.query('INSERT INTO users SET ?' ,data,(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result.insertId);
            }
        })
    })
}
const cekLogin = (conn,username,password)=> {
    return new Promise((resolve,reject) => {
        conn.query(`SELECT nickname, pass FROM users WHERE nickname LIKE '${username}' AND pass LIKE '${password}'`,(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const updateStatus = (conn,postID,userID)=>{
    return new Promise((resolve,reject)=>{
        conn.query('UPDATE thread SET lock_by = '%{userID}%' WHERE postID LIKE '%{postID}%'', (err,result)=>{
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getBannedUser= conn=>{
    return new Promise((resolve,reject) => {
        conn.query(`SELECT * FROM users WHERE status = 'banned'`,(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const getLockedThread= (conn)=>{
    return new Promise((resolve,reject) => {
        conn.query('SELECT * FROM thread WHERE lock_by IS NOT NULL',(err,result)=> {
            if(err){
                reject(err);
            } else {
                resolve(result);
            }
        })
    })
}
const reportUser = (conn)=>{
    return new Promise((resolve,reject)=>{
        conn.query('SELECT * FROM users' ,(err,result)=>{
            if(err) throw err;
            fs.writeFile('user.json',JSON.stringify(result),function(err){
                if(err) throw err;

            })
        })
    })
}
const reportThread = (conn)=>{
    return new Promise((resolve,reject)=>{
        conn.query('SELECT * FROM thread' ,(err,result)=>{
            if(err) throw err;
            fs.writeFile('thread.json',JSON.stringify(result),function(err){
                if(err) throw err;
                
            })
        })
    })
}


app.use(session({resave: true ,secret: '123456' , saveUninitialized: true}))
app.listen(8080)
app.set('view engine', "ejs")
app.use(bodyParser())
app.use(flash());



app.get('/',async(req, res)=> {
    const conn = await dbConnect();
    res.render('login')
})
app.post('/',async(req, res)=>{
    const conn = await dbConnect(); 
    var username = req.body.user;
    var password = req.body.pass;
    const cekUser = cekLogin(conn,username,password);
    var sql = `SELECT * FROM users WHERE nickname = '${username}' AND pass = '${password}'`
    conn.query(sql,[username,password],(err,results) => {
        if(err){
            throw err;
        }
        if (results.length>0){
            req.session.loggedIn = true;
            req.session.username = username;
            req.session.name = results[0].name;
            req.session.role = results[0].role;
            req.session.status = results[0].status;
            req.session.userId = results[0].id;
            req.session.join = results[0].joined_date;

            if(results[0].role == 'admin'){
                res.redirect('/homeAdmin');
            } else if(results[0].role == 'mod') {
                res.redirect('/homeMod');
            } else {
                res.redirect('/home');
            }
        }else {
            req.flash('message','Username atau Password salah' )
            res.redirect('/')
        }
    })
})
app.get('/home',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    conn.release();
    if (req.session.loggedIn){
        var name = req.session.name;
        var pass = req.session.pass;
        res.render('home',{posts})
    } else {
        req.flash('message', "LOGIN TERLEBIH DAHULU")
        res.redirect('/')
    }
})
app.get('/postList',async(req, res)=>{
    const conn = await dbConnect();
    const categories = await getCategory(conn);
    var posts = {}
    res.render('postList',{categories,posts})
})
app.get('/new',async(req, res)=>{
    res.render('newPost')
})
app.get('/profile',async(req, res)=>{
    const conn = await dbConnect();
    const posts = await getUserPost(conn,req.session.userId)
    var name = req.session.name;
    var date = req.session.join;
    var id = req.session.id;
    var status = req.session.status;
    res.render('profile', {name,date,posts,status})
})
app.get('/homeAdmin',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    if (req.session.loggedIn && req.session.role == 'admin'){
        res.render('homeAdmin',{posts})
    } else {
        req.flash('message', "LOGIN TERLEBIH DAHULU")
        res.redirect('/')
    }
})
app.get('/homeMod',async(req, res)=>{
    const conn = await dbConnect();
    let posts = await getPost(conn);
    if (req.session.loggedIn && req.session.role == 'mod'){
        res.render('homeMod',{posts})
    } else {
        req.flash('message', "LOGIN TERLEBIH DAHULU")
        res.redirect('/')
    }
})
app.get('/upUser',async(req,res)=>{
    const conn = await dbConnect();
    res.render('updateUser')
})
app.get('/upThread',async(req,res)=>{
    const conn = await dbConnect();
    res.render('updateThread')
})
app.get('/postListAdmin',async(req,res)=>{
    const conn = await dbConnect();
    const categories = await getCategory(conn);
    const posts = {}
    res.render('postlistAdmin',{categories,posts})
})
app.get('/profileMod',async(req, res)=>{
    const conn = await dbConnect();
    var users = await getBannedUser(conn);
    var posts = await getLockedThread(conn);
    res.render('modProfile',{users,posts})
})
app.get('/profileAdmin',async(req, res)=>{
    const conn = await dbConnect();
    var name = req.session.name;
    var users = await getUser(conn);
    res.render('adminProfile',{users,name});
})
app.get('/signup',async(req, res)=>{
    const conn = await dbConnect();
    res.render('signup');
})
app.post('/signup',async(req, res)=>{
    const conn = await dbConnect();
    var username = req.body.user;
    var password = req.body.pass;
    var email = req.body.email;
    var fullname = req.body.name;
    var date = new Date();
    var data = {name: fullname, nickname: username, email: email, pass: password, role: "user", joined_date: date, status: 'normal'}
    const signUps = await insertUser(conn,data);
    req.session.loggedIn = true;
    req.session.name = fullname;
    req.session.join = date;
    req.session.userId = signUps;
    res.redirect('home');
})

app.post('/new',async(req, res)=>{
    const conn = await dbConnect();
    var title = req.body.title;
    var content = req.body.content;
    var tags = req.body.tags;
    var isBanned = req.body.status;
    if(isBanned === 'banned'){
        res.redirect('home');
    } else {
        if(tags.value === 'Wholesome'){
            var tag = 1;
        } else if (tags.value === 'News'){
            var tag = 2;
        } else if (tags.value === 'Confession'){
            var tag = 3;
        } else {
            var tag = 4;
        }
        var date = new Date();
        var data = {title: title, created_date: date, lock_by: null, content: content, author_id: req.session.userId, category_id: tag}
        const newPost = 'INSERT INTO thread SET ?';
        conn.query(newPost, data, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    }
    
    res.redirect('home');
})
app.post('/upUser',async(req, res)=>{
    const conn = await dbConnect();
    var id = req.body.id;
    var role = req.body.role;
    if(role === "user" || role === "mod" || role === "admin"){
        const updateRole = `UPDATE users SET role = '${role}' WHERE id = '${id}' `;
        const data = {role:role,id:id}
        conn.query(updateRole, data, function (err, result) {
            if (err) throw err;
            console.log("1 record updated "+ role);
            res.redirect('homeAdmin');
        });
    } else {
        res.redirect('profileAdmin');
        console.log(role)
    }
})
app.post('/banUser',async(req, res)=>{
    const conn = await dbConnect();
    var id = req.body.userID;
    const updateRole = `UPDATE users SET status = 'banned' WHERE id = ${id} `;
    conn.query(updateRole, function (err, result) {
        if (err) throw err;
        console.log("1 record updated "+ role);
        res.redirect('homeMod');
    });
    
})
app.post('/lockThread',async(req, res)=>{
    const conn = await dbConnect();
    var id = req.body.userID;
    var modId = req.session.id;
    const updateRole = `UPDATE thread SET lock_by = '${modId}' WHERE id = ${id} `;
    conn.query(updateRole, function (err, result) {
        if (err) throw err;
        console.log("1 record updated "+ role);
        res.redirect('homeMod');
    });
})
app.post('/delThread',async(req, res)=>{
    const conn = await dbConnect();
    var id = req.body.userID;
    var sql = `DELETE FROM thread WHERE id = ${id}`
    conn.query(sql,(err,result)=>{
        if(err) throw err
        console.log("1 user deleted")
    })
    res.redirect('homeAdmin')
})
app.post('/delUser',async(req, res)=>{
    const conn = await dbConnect();
    var id = req.body.userID;
    var sql = `DELETE FROM users WHERE id = ${id}`
    conn.query(sql,(err,result)=>{
        if(err) throw err
        console.log("1 user deleted")
    })
    res.redirect('homeAdmin')
})
app.get('/testing',async(req, res)=>{
    const conn = await dbConnect();
    res.send("test" + req.body.userId);
})
app.post('/filter/:tag',async(req, res)=>{
    const conn = await dbConnect();
    var tagId = req.params['tag'];
    const categories = await getCategory(conn);
    let posts = await getTaggedPost(conn,tagId);
    res.render('postList',{categories,posts});
})
app.get('/pdfDocument',async(req,res)=>{
    const conn = await dbConnect();
    const users = await getUser(conn);
    res.redirect('homeAdmin');
    const table = {
        title :"User",
        subtitle: "User report",
        headers:[{lable: 'ID', property:'id'},
        {label:'Full name',property:'name'}, 
        {label:'Username',property:'user'}, 
        {label:'E-mail',property:'email'}, 
        {label:'Role',property:'rle'},
        {label:'Date joined',property:'date'}, 
        {label:'Status',property:'status'},],
        rows: users,
    }
    doc.table(table,{
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font("Helvetica").fontSize(8);
        indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);}
    });
    doc.end();
})