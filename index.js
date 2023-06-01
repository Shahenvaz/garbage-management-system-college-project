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
    if(req.cookies.driverInformation)
    res.render('index',{adminInfo:adminInfo,data:data,data1:1})
    else
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
    let warning = req.cookies.warning
    res.clearCookie('warning')
    res.render('admin/signup',{warning:warning})
})

app.post('/admin-sign-up',(req,res)=>{
    if(req.body["admin-pass"].length < 8)
    {
        res.cookie("warning","password length must be 8 charector")
        res.redirect('/admin-sign-up')
    }
    else if (req.body["admin-key"] != "gms123")
    {
        res.cookie("warning","wrong admin key is provided")
        res.redirect('/admin-sign-up')
    }
    db.adminSignUp(req.body)
    res.redirect('/admin-login')
})

app.post('/admin-login',async (req,res)=>{
    if(req.cookies.driverInformation)
    {
        res.clearCookie('driverInformation')
    }
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
    let feedback = await db.getAllFeedBack()
    let countData = await db.countEverything()

    let status = req.cookies.status
    res.clearCookie('status')
    if(adminInfo)
    res.render('admin/dashboard',{adminInfo:adminInfo,data:data,driverInfo:driverInfo,dustbinInfo:dustbinInfo,dustbinData:dustbinData,status:status,feedback:feedback,countData:countData})
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

app.get('/garbage-collector-login',(req,res)=>{
    if(req.cookies.driverInformation)
        res.redirect('/driver-dashboard')
    let warning = req.cookies.warning
    res.clearCookie('warning')
    res.render('driver/login',{warning:warning})
})

app.post('/garbage-collector-login', async(req,res)=>{
    result = await db.driverLogin(req.body)
    if(result.length)
    {
        res.cookie('driverInformation',result)
        res.redirect('/driver-dashboard')
    }
    else
    {
        res.cookie("warning","wrong email id or password unable to login")
        res.redirect('/garbage-collector-login')
    }
})

app.get('/driver-dustbin-data',async (req,res)=>{
    response = await db.getAllDustbinOfDriver()
    var results = [];

        var toSearch = req.cookies.driverInformation[0].driver_id;

        for (var i = 0; i < response.length; i++) {
            if(response[i]["dustbin-driver"] == toSearch)
            {
                results.push(response[i])
            }
        }
        
    res.render('driver/data',{dustbinData:results})
})

app.get('/driver-dashboard',(req,res)=>{
    if(req.cookies.driverInformation)
    res.render('driver/index',{data1: 1 })
    else
    res.render('driver/index',{data1: 0 })
})

app.get('/driver-logout',(req,res)=>{
    res.clearCookie('driverInformation')
    res.redirect('/')
})

app.post('/update-driver',async(req,res)=>{
    console.log(req.body)
    await db.updateOneDriver(req.body)
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
    let singleDustbinData = await db.getOneDustbin({id:req.query.id})
    res.render('dustbin/modifyDustbin',{singleDustbinData,singleDustbinData})
} )

app.get('/updateDustbin',async(req,res)=>{
    let singleDustbinData = await db.updateOneDustbin({id:req.query.id})
    res.json(singleDustbinData)
})
app.get('/clearDustbin',async(req,res) =>{
    await db.clearOneDustbin({dustbinId:req.query.id})
    res.redirect('/driver-dashboard')
})
// dustbin end here


//customer feedback

app.get('/feedback',(req,res)=>{
    res.render('customer/complaint.ejs')
})
app.post('/complaint',async(req,res)=>{
    let id = await idGenerator()
    req.body = Object.assign(req.body,{"complainid":id})
    res.cookie("complainId",id)
    await db.registerComplaint(req.body)
    res.redirect('/success')
})
app.get('/success',(req,res)=>{
    if(req.cookies.complainId)
    {
    let id = req.cookies.complainId
    res.clearCookie("complainId")
    res.render('customer/success',{complainId:id})
    }
    else
    {
        res.redirect('/')
    }
})
app.get('/remove-complain',async(req,res)=>{
    await db.removeComplain({complainid:req.query.id})
    res.redirect('/admin-dashboard')
})
app.get('/mark-as-complete',async(req,res)=>{
    await db.markAsComplete({complainid:req.query.id})
    res.redirect('/admin-dashboard')
})
app.get('/getReport',async(req,res)=>{
    let responce = await db.getReport({"date" : req.query.date})
    console.log(responce)
    res.render('customer/data',{responce:responce})
})
app.get('/getDailyReport',async(req,res)=>{
    let responce = await db.getReport({"date" : req.query.date})
})
//








// id generatw
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



