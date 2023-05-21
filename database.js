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
        console.log(response["dustbin-driver"])
        let res3 = await this.collection.findOne({ driver_id: response["dustbin-driver"] })
        Object.assign(response, res2)
        Object.assign(response, res3)
        return response
    }
    updateOneDustbin = async function (params) {
        this.collection = this.database.collection('DustbinData')
        console.log(params)
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
        await this.collection.updateOne(params, { $set: { "dustbinCurWeight": 0 } })
    }
}


exports.Connection = Connection