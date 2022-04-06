const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const moment = require('moment');
const date = moment().format();

mongoose.connect('mongodb://localhost:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MONGO CONNECTION OPEN!!!")
    })
    .catch(err => {
        console.log("OH NO MONGO CONNECTION ERROR!!!!")
        console.log(err)
    })


const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDb = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const rand100 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: "624c1d16199d3ae9b697929b",
            location: `${cities[rand100].city}, ${cities[rand100].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi numquam at, magnam expedita maxime consectetur magni! Officiis autem totam cumque? Cupiditate inventore facilis dicta dolorem rem, tempore numquam reprehenderit ex.',
            price,
            postedOn: date,
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[rand100].longitude,
                    cities[rand100].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/ddeu2euos/image/upload/v1648714766/YelpCamp/zpze2vhmobghxqbfazli.avif',
                    filename: 'YelpCamp/zpze2vhmobghxqbfazli',
                },
                {
                    url: 'https://res.cloudinary.com/ddeu2euos/image/upload/v1648717400/YelpCamp/eq5stsukqzvuavnvoqsc.avif',
                    filename: 'YelpCamp/eq5stsukqzvuavnvoqsc',
                }
            ]

        })
        await camp.save();
    }
}

seedDb().then(() => {
    mongoose.connection.close();
})