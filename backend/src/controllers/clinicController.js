const Clinc = require("../models/Clinic");

/////////////// create clinic ////////////////////

const createClinic = async (req, res, next) =>{
    try{
        const {name, description} = req.body;
        if(!name) return res.status(400).json({msg: "Missing Data"});
        const existClinic = await Clinc.findOne({name});
        if(existClinic) return res.status(400).json({msg: "Clinic Already Exist"});
        const newClinic = await Clinc.create({name, description});
        res.status(201).json({
            msg: "Done Created Clinic",
            data: newClinic
        });
      
    }catch(error){
        next(error);
    }

}


module.exports = {createClinic};
