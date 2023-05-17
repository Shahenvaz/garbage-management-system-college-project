const express = require('express')
const app = new express()
require("dotenv").config()
const {Connection}  = require('./database')
const db =  new Connection

app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))
app.set('view engine', 'ejs')


//multer 
const multer  = require('multer')
const storage = multer.diskStorage({

    destination: function(req, file, cb) {

        cb(null, './public/data/driver-photo');

    },

  

    filename: function(req, file, cb) {

        cb(null, file.originalname);

    }

});

  

var upload = multer({ storage: storage })
// cookies work start here

var cookieParser = require('cookie-parser');
app.use(cookieParser());

// cookies work end here



app.get('/',async(req,res)=>{
    let adminInfo = req.cookies.adminInformation
    let data = await db.getAllAdminDetails()
    res.render('index',{adminInfo:adminInfo,data:data})
})

// admin login work

app.get('/admin-login',(req,res)=>{
    if(req.cookies.adminInformation)
        res.redirect('/admin-dashboard')
    let warning = req.cookies.warning
    res.clearCookie('warning')
    res.render('admin/login',{warning:warning})
})

app.get('/admin-sign-up',(req,res)=>{
    res.render('admin/signup')
})

app.post('/admin-sign-up',(req,res)=>{
    db.adminSignUp(req.body)
    res.redirect('/admin-login')
})

app.post('/admin-login',async (req,res)=>{
    result = await db.adminLoginCheck(req.body)
    if(result.length)
    {
        res.cookie('adminInformation',result)
        res.redirect('/admin-dashboard')
    }
    else
    {
        res.cookie("warning","wrong email id or password unable to login")
        res.redirect('/admin-login')
    }
})
// admin login finish


// admin Dashboard start

app.get('/admin-dashboard',async(req,res)=>{
    let adminInfo = req.cookies.adminInformation
    let driverInfo = await db.getAllDriverDetails()
    let data = await db.getAllAdminDetails()
    let dustbinInfo = await db.getAllDustbin()
    let dustbinData = await db.getAllDustinData()
    console.log(dustbinData)
    
    let status = req.cookies.status
    res.clearCookie('status')
    if(adminInfo)
    res.render('admin/dashboard',{adminInfo:adminInfo,data:data,driverInfo:driverInfo,dustbinInfo:dustbinInfo,dustbinData:dustbinData,status:status})
    else
    res.redirect('/admin-login')
})

//admin Dashboard End


//admin log out

app.get('/admin-logout',(req,res)=>{
    res.clearCookie('adminInformation')
    res.redirect('/admin-login')
})

//admin log out end


// driver task starts here

app.get('/add-driver',(req,res)=>{
    let status = req.cookies.status
    res.clearCookie('status')
    res.render('admin/add-driver',{status:status})
})

app.post('/driver-register',upload.single('driver-photo'),async(req,res,next)=>{
    driver_id = await idGenerator()
    driver_data = Object.assign(req.body,{"driver_photo" : '/data/driver-photo/'+req.file.originalname})
    driver_data = Object.assign(driver_data,{driver_id:driver_id})

    if(req.body["admin-pass"] != req.cookies.adminInformation[0]["admin-pass"])
    {
        res.cookie("status", "admin password is incorrect")
        res.redirect('/add-driver')
    }
    else
    {
    await db.addDriver(driver_data)
    res.cookie("status", "driver added successfully")
    res.redirect('/admin-dashboard')
    }
})


app.get('/delete-driver/:id',async(req,res)=>{
    await db.deleteDriver({"driver_id":req.params.id})
    res.cookie("status","Driver Deleted Successfully")
    res.redirect('/admin-dashboard')
})


// driver task end here


// dustbin task start here

app.get('/add-dustbin',async(req,res)=>{
    let driverName = await db.getAllDriverDetails()
    res.render('admin/add-dustbin',{driverName:driverName})
})

app.post('/add-dustbin',async(req,res)=>{
    let id = await idGenerator()
    req.body = Object.assign(req.body,{id:id})
    await db.addDustbin(req.body)
    res.cookie("status","Dustin Added Successfully")
    res.redirect('/admin-dashboard')
})


app.get('/dustbin-filler',async(req,res)=>{
    let dustbinInfo = await db.getAllDustbin()
    let dustbinData = await db.getAllDustinData()
    res.render('dustbin/index',{dustbinData,dustbinInfo})
})

app.get('/modifyDustin',async(req,res) =>{
    res.render('dustbin/modifyDustbin')
} )
// dustbin end here




// id generat
function idGenerator()
{
    var id = '';
    var charector = ['a','b','c','d','e','f','g','h','i','j','k']
    for(let i=0; i< 5; i++ )
    {
        id = id + (Math.ceil(Math.random()*10)).toString()
        id = id + charector[Math.ceil(Math.random()*10)]
    }

     return id
}

//


app.listen(process.env.PORT, ()=>{
    console.log("server is running on this port "+ process.env.PORT)
})




// this is a tes



