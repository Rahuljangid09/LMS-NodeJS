const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User, Book } = require("./models/user.js");

const sampleUsers = [
  { username: "oggy", password: "123", borrowedBooks: [] },
  { username: "jack", password: "123", borrowedBooks: [] },
  { username: "tom", password: "123", borrowedBooks: [] },
];

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    copiesAvailable: 5,
  },
  { title: "To Kill a Mockingbird", author: "Harper Lee", copiesAvailable: 3 },
  { title: "1984", author: "George Orwell", copiesAvailable: 4 },
  { title: "Pride and Prejudice", author: "Jane Austen", copiesAvailable: 6 },
  {
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    copiesAvailable: 2,
  },
  { title: "Moby-Dick", author: "Herman Melville", copiesAvailable: 3 },
  {
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    copiesAvailable: 5,
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/LMS");
    console.log("Connected to MongoDB");

    await User.deleteMany();
    await Book.deleteMany();
    console.log("Old data cleared");

    const books = await Book.insertMany(sampleBooks);
    console.log("Books inserted:", books);

    // Hash passwords before inserting users
    for (let user of sampleUsers) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    const users = await User.insertMany(sampleUsers);
    console.log("Users inserted:", users);

    const oggy = await User.findOneAndUpdate(
      { username: "oggy" },
      { $set: { borrowedBooks: [books[0]._id, books[1]._id] } },
      { new: true }
    ).populate("borrowedBooks");

    const jack = await User.findOneAndUpdate(
      { username: "jack" },
      { $set: { borrowedBooks: [books[2]._id] } },
      { new: true }
    ).populate("borrowedBooks");

    console.log("Updated Oggy:", oggy);
    console.log("Updated Jack:", jack);

    console.log("Sample data inserted successfully");
    mongoose.connection.close();
  } catch (err) {
    console.error("Error inserting sample data:", err);
  }
};

seedDatabase();
