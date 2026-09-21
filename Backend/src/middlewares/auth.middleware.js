const foodPartnerModel = require("../models/foodpartner.model")
const userModel = require("../models/user.model")

const jwt = require("jsonwebtoken")

function getTokenFromRequest(req) {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        return req.headers.authorization.split(" ")[1];
    }
    return null;
}

async function authFoodPartnerMiddleware(req,res,next){
    const token = getTokenFromRequest(req);

    if(!token)
    {
        return res.status(401).json({
            message : "please login first"
        })
    }

    try
    {
       const decoded =  jwt.verify(token,process.env.JWT_SECRET)

       if (decoded.role && decoded.role !== "food-partner") {
         return res.status(401).json({
           message: "Access restricted to food partners",
         });
       }

       const foodPartner = await foodPartnerModel.findById(decoded.id);

       if (!foodPartner) {
         return res.status(401).json({
           message: "Food partner not found",
         });
       }

       req.foodPartner = foodPartner;
       next();

    }catch(err)
    {
        return res.status(401).json({
            message : "Invalid token"
        })
    }
}

async function authUserMiddleware(req, res, next) {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({
            message: "please login first"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role && decoded.role !== "user") {
            return res.status(401).json({
                message: "Access restricted to users",
            });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        req.user = user;

        next();

    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

module.exports = {
    authFoodPartnerMiddleware,
    authUserMiddleware
}