const Tour = require("./../models/tourModel");
const User = require("./../models/userModel");
const Booking = require("./../models/bookingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get all the data from the collection
  const tours = await Tour.find();
  //2. Build template

  //3. Render that template using tour data from 1.
  res.status(200).render("overview", {
    title: "All Tours",
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the dat, for the requested tour (including reviews and guides)
  const {
    slug
  } = req.params;
  const tour = await Tour.findOne({
    slug
  }).populate({
    path: "reviews",
    fields: "review rating user"
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name."), 404);
  }

  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account"
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account"
  });
}

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1. Find all bookings //doing it manually here
  const bookings = await Booking.find({
    user: req.user.id
  });

  //2. Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({
    _id: {
      $in: tourIDs
    }
  });

  res.status(200).render("overview", {
    title: "My Tours",
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidators: true
  }); //Access this route if we are logged in
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser
  });
});