require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const { User } = require("./models/user");

mongoose.connect(process.env.MONGO_URI)
.then( async()=>{


        let admin = await User.findOne({ username: "admin" });

        if (!admin) {
            const hashedPassword = await bcrypt.hash("admin123", 10); // Hash password
            await User.create({
                username: "admin",
                password: hashedPassword,
                isAdmin: true
            });
            console.log("Admin user created successfully!");
        } else {
            console.log("Admin already exists!");
        }

        mongoose.connection.close();
    })
    .catch(err => console.error("Error connecting to MongoDB:", err));
