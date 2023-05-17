require("dotenv").config()
function portTest()
{
    return Number(process.env.PORT)
}
exports.portTest=portTest