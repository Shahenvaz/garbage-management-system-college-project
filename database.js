const { MongoClient } = require('mongodb')

class Connection {
    url = "mongodb://127.0.0.1:27017/"
    client = new MongoClient(this.url)
    database = this.client.db('garbage-management-system')
    collection = this.database.collection('AdminDetails')

    adminSignUp = async function (params) {
        this.collection = this.database.collection('AdminDetails')
        await this.collection.insertOne(params)
    }
    adminLoginCheck = async function (params) {
        this.collection = this.database.collection('AdminDetails')
        let response = await this.collection.find(params).toArray()
        return response
    }
    getAllAdminDetails = async function () {
        this.collection = this.database.collection('AdminDetails')
        let response = await this.collection.find().toArray()
        return response
    }


    // =================================================================== driver work ======================================

    addDriver = async function (params) {
        this.collection = this.database.collection('DriverDetails')
        await this.collection.insertOne(params)

    }
    getAllDriverDetails = async function () {
        this.collection = this.database.collection('DriverDetails')
        let response = await this.collection.find().toArray()
        return response
    }

    deleteDriver = async function (params) {
        this.collection = this.database.collection('DriverDetails')
        await this.collection.deleteOne(params)
    }

    driverLogin = async function (params) {
        this.collection = this.database.collection('DriverDetails')
        let response = await this.collection.find(params).toArray()
        return response
    }
    updateOneDriver = async function(params) {
    this.collection = this.database.collection('DriverDetails')
    await this.collection.updateOne({ "driver_id" : params.driver_id }, { $set: params })
    }
    // =================================================================== driver work ======================================

    addDustbin = async function (params) {
        let defaultData = {
            "dustbinId": params.id,
            "dustbinMaxWeight": 100,
            "dustbinCurWeight": 0
        }
        this.collection = this.database.collection('DustbinDetails')
        await this.collection.insertOne(params)
        this.collection = this.database.collection('DustbinData')
        await this.collection.insertOne(defaultData)
    }

    getAllDustbin = async function () {
        this.collection = this.database.collection('DustbinDetails')
        let response = this.collection.aggregate([{ $lookup: { from: "DriverDetails", localField: "dustbin-driver", foreignField: "driver_id", as: "DustbinAllDetails" } }]).toArray()
        return response
    }

    getAllDustinData = async function () {
        this.collection = this.database.collection('DustbinDetails')
        let response = this.collection.aggregate([{ $lookup: { from: "DustbinData", localField: "id", foreignField: "dustbinId", as: "DustbinStatus" } }]).toArray()
        return response
    }

    getOneDustbin = async function (params) {
        this.collection = this.database.collection('DustbinDetails')
        let response = await this.collection.findOne(params)
        this.collection = this.database.collection('DustbinData')
        let res2 = await this.collection.findOne({ dustbinId: params.id })
        this.collection = this.database.collection('DriverDetails')
        let res3 = await this.collection.findOne({ driver_id: response["dustbin-driver"] })
        Object.assign(response, res2)
        Object.assign(response, res3)
        return response
    }
    updateOneDustbin = async function (params) {
        this.collection = this.database.collection('DustbinData')
        let res2 = await this.collection.findOne({ dustbinId: params.id })
        let newWeight = res2.dustbinCurWeight + 10
        await this.collection.updateOne({ dustbinId: params.id }, { $set: { "dustbinCurWeight": newWeight } })
        let response = await this.collection.findOne({ dustbinId: params.id })
        return response
    }
    getAllDustbinOfDriver = async function (params) {
        this.collection = this.database.collection('DustbinDetails')
        let response = await this.collection.aggregate([{ $lookup: { from: "DustbinData", localField: "id", foreignField: "dustbinId", as: "DustbinStatus" }} ,{$sort:{ "DustbinStatus.dustbinCurWeight": -1 }}]).toArray()
        return response
    }
    clearOneDustbin = async function (params) {
        this.collection = this.database.collection('DustbinData')
        let respon = await this.collection.findOne(params)
        await this.collection.updateOne(params, { $set: { "dustbinCurWeight": 0 } })
        this.collection = this.database.collection('DustbinDetails')
        let responce = await this.collection.findOne({id:params.dustbinId})
        delete responce._id
        let date = new Date()

        var completeDate
        if(date.getMonth()+1 >= 10)
        {
         completeDate = date.getFullYear() + '-' +date.getMonth()+1 + '-' + date.getDate()
        }
        else
        {
         completeDate = date.getFullYear() + '-' + '0' + (date.getMonth()+1) + '-' + date.getDate()
        }
        this.collection = await this.database.collection('DriverDetails')
        let driver = await this.collection.findOne({"dustbin-driver": respon["dustbin-driver"]})
        Object.assign(responce,{ date : completeDate })
        Object.assign(responce,{ dustbinCurWeight : respon.dustbinCurWeight })
        Object.assign(responce,{driverName : driver["driver-name"]})
        
        this.collection = await this.database.collection('dateOfCleaning')
        await this.collection.insertOne(responce)
    }

    //

    registerComplaint = async function(params) {
        this.collection = this.database.collection('Feedback')
        await this.collection.insertOne(params)
    }
    getAllFeedBack = async function() {
        this.collection = this.database.collection('Feedback')
        let responce = await this.collection.find().toArray()
        return responce
    }
    removeComplain = async function(params) {
        this.collection = this.database.collection('Feedback')
        await this.collection.deleteOne(params)
    }
    markAsComplete = async function(params) {
        this.collection = this.database.collection('Feedback')
        let responce = await this.collection.findOne(params)
        delete responce._id
        this.collection = this.database.collection('completedComplain')
        await this.collection.insertOne(responce)

        this.collection = this.database.collection('Feedback')
        await this.collection.deleteOne(params)
    }
    getReport = async function name(params) {
        console.log(params)
        this.collection = await this.database.collection('dateOfCleaning')
        let responce = await this.collection.find(params).toArray()
        return responce
    }
    // count every thing

   countEverything =  async function (params) {
        let totalRecord = {}
        this.collection = this.database.collection('DustbinDetails')
        let totalDustbin = await this.collection.count()
        Object.assign(totalRecord,{totalDustbin:totalDustbin})
        this.collection = this.database.collection('DriverDetails')
        let totalDrivers = await this.collection.count()
        Object.assign(totalRecord,{totalDrivers:totalDrivers})
        this.collection = this.database.collection('Feedback')
        let totalComplain = await this.collection.count()
        Object.assign(totalRecord,{totalComplain:totalComplain})
        this.collection = this.database.collection('completedComplain')
        let completedComplain = await this.collection.count()
        Object.assign(totalRecord,{completedComplain:completedComplain})
        return totalRecord
   }

}



exports.Connection = Connection