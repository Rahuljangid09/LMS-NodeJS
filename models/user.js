require('dotenv').config();
const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    borrowedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],  // Reference to books
    isAdmin: { type: Boolean, default: false }  // Add admin flag
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Book Schema
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    copiesAvailable: { type: Number, default: 1, min: 0 }
}, { timestamps: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = { User, Book };
