//modern view "controllers" architecture will be created
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage.price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
};



//2.) Route handlers
exports.getAllTours = async (req, res) => {
    try {
        //BUILD QUERY
        console.log(req.query);
        // 1a. Filtering
        // const queryObj = {
        //     ...req.query
        // };
        // const excludedFields = ["page", "sort", "limit", "fields"];

        // excludedFields.forEach(el => delete queryObj[el]);
        // // console.log(req.query, queryObj);


        // //1b. Adevanced filetering
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b{gte|gt|lte|lt}\b/g, match => `$${match}`);
        // console.log(JSON.parse(queryStr));

        // // { difficulty: 'easy, duration: { $gte:5 } }
        // // { difficulty: 'easy, duration: { gte:5 } }

        // // const query = Tour.find(req.query);
        // let query = Tour.find(JSON.parse(queryStr));

        // 2. Sorting
        // if (req.query.sort) {
        //     const sortBy = req.query.sort.split(',').join(" ");
        //     query = query.sort(sortBy);
        //     //sort('price ratingsAverage')
        // } else {
        //     query = query.sort("-createdAt");
        // }

        //3. Field limiting
        // if (req.query.fields) {
        //     const fields = req.query.fields.split(",").join(" "); //coming from javascriptx
        //     query = query.select(fields);
        //     // query = query.select('name duration difficulty');
        //     console.log(fields);

        // } else {
        //     query = query.select('-__v');
        // }

        //4. Pagination
        // const page = req.query.page * 1 || 1; //defining a default in Javascript by putting || operator
        // const limit = req.query.limit * 1 || 100;
        // const skip = (page - 1) * limit;

        // query = query.skip(skip).limit(limit);

        // if (req.query.page) {
        //     const numTours = await Tour.countDocuments();
        //     if (skip >= numTours) throw new Error("This page does not exist");
        // }

        //Get all tours should always pass through these queries
        // EXECUTE QUERY                 this.query.find(JSON.parse(queryStr));
        const features = new APIFeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const tours = await features.query;



        // const query = await Tour.find()
        //     .where("duration")
        //     .equals(5) //or lte()
        //     .where("difficulty")
        //     .equals("easy");

        // console.log(req.requestTime);

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            // requestedAt: req.requestTime,
            results: tours.length,
            data: {
                tours
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
        // Tour.findOne({_id: req.params.id}) or Tour.findOne({req.params.name}) incase name is one of the params
        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });

    }
};

exports.createTour = async (req, res) => {
    try {
        // const newTour = new Tour({});
        // newTour.save();

        //it returns a Promise and instead of using Promise, async await will be used
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                tour: newTour
            }
        });

    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: `${err} \n Invalid data sent`
        });
    }
};

exports.updateTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // to send updated data to the client, like the new document
            runValidators: true
        });
        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};

exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};


exports.getTourStats = async (req, res) => {
    try {
        const stats = await Tour.aggregate([{
                $match: {
                    ratingsAverage: {
                        $gte: 4.5
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $toUpper: '$difficulty'
                    },
                    // _id: '$ratingsAverage',
                    numTours: {
                        $sum: 1
                    },
                    numRatings: {
                        $sum: '$ratingsQuantity'
                    },
                    avgRating: {
                        $avg: '$ratingsAverage'
                    },
                    avgPrice: {
                        $avg: '$price'
                    },
                    minPrice: {
                        $min: '$price'
                    },
                    maxPrice: {
                        $max: '$price'
                    }
                }
            },
            {
                $sort: {
                    avgPrice: 1
                }
            },
            // {
            //     $match: {
            //         _id: {
            //             $ne: 'EASY'
            //         }
            //     }
            // }
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};

exports.getMonthlyPlan = async (req, res) => {
    try {
        const year = req.params.year * 1; //2021
        const plan = await Tour.aggregate([{
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${year}-12-31`) //$lt: new Date(`${year+1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $month: '$startDates'
                    },
                    numTourStarts: {
                        $sum: 1 //no of tours
                    },
                    tours: {
                        $push: '$name'
                    }
                }
            },
            {
                $addFields: {
                    month: '$_id'
                }
            },
            {
                $project: {
                    _id: 0 //not to show
                }
            },
            {
                $sort: {
                    numTourStarts: -1 //in descending order
                }
            },
            {
                $limit: 12 // not that helpful
            }
        ]);
        res.status(200).json({
            status: 'success',
            results: plan.length,
            data: {
                plan
            }
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err
        });
    }
};