const express = require("express");
require('dotenv').config();
const mongoose = require('mongoose');
const path = require("path");
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');

const session = require("express-session");
const flash = require("connect-flash");

const { User, Book } = require("./models/user.js"); 

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride('_method'));

app.use(session({
  secret: "yourSecretKey", // Change this to a strong secret key
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});





mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// Routes
app.get("/", (req, res) => {
  res.render("getStarted.ejs");
});

app.get("/auth", async (req, res) => {
  try {
    let userdata = await User.find(); // Fetch all users
    console.log("Fetched Users:", userdata);
    res.render("Login.ejs", { userdata });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/auth/userdash", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log("Received userId:", userId); // Debugging

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send("Invalid or missing User ID");
    }

    // Find user and populate borrowed books
    const user = await User.findById(userId).populate("borrowedBooks");
    if (!user) {
      return res.status(404).send("User not found");
    }

    
    if (user.isAdmin) {
      console.log(`User ${user.username} is an admin. Redirecting to admin dashboard.`);
      return res.redirect("/admin/dashboard");
    }

    // Fetch all books
    const allBooks = await Book.find();

    
    res.render("userDash.ejs", { user, allBooks });

  } catch (error) {
    console.error("Error fetching user dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/auth/userdash", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username }).populate("borrowedBooks");
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send("Invalid username or password");
    }

    // Fetch all users and books
    const allUsers = await User.find();
    const allBooks = await Book.find();

    // Redirect admin to the admin dashboard
    if (user.isAdmin) {
      console.log(`Admin ${user.username} logged in.`);
      return res.render("adminDash.ejs", { allBooks, allUsers });
    }

    
    console.log(`User ${user.username} logged in.`);
    res.redirect(`/auth/userdash?userId=${user._id}`);

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/borrow/:id", async (req, res) => {
  try {
    const bookId = req.params.id; 
    const userId = req.body.userId; 

    
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).send("Book not found");

    
    if (book.copiesAvailable <= 0) {
      return res.status(400).send("No copies available for this book");
    }

    
    await User.findByIdAndUpdate(userId, { $push: { borrowedBooks: bookId } });

    
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      { $inc: { copiesAvailable: -1 } },
      { new: true }
    );
    if (updatedBook.copiesAvailable === 0) {
      await Book.findByIdAndDelete(bookId);
    }

    
    res.redirect(`/auth/userdash?userId=${userId}`);
  } catch (error) {
    console.error("Error borrowing book:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/return/:id", async (req, res) => {
  const bookId = req.params.id;
  const userId = req.body.userId;

  console.log("borrowedbool id:", bookId);
  console.log("user id:", userId);

  await User.findByIdAndUpdate(userId, { $pull: { borrowedBooks: bookId } });

  await Book.findByIdAndUpdate(bookId, { $inc: { copiesAvailable: 1 } });

  res.redirect(`/auth/userdash?userId=${userId}`);
});

// admin routes
app.get("/admin/dashboard",async (req,res)=>{
    
  let allUsers= await User.find()
  let allBooks = await Book.find();
  res.render("adminDash.ejs",{allBooks,allUsers})
})

app.get("/remove/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let removeBook = await Book.findByIdAndDelete(id);
    
    if(!removeBook){
        res.send("no book found")
    }
    res.redirect("/admin/dashboard")

  } catch (err) {
    console.log(err);
    res.send("Internal Server Error");
  }
});

app.get("/readers",async (req,res)=>{
  try{
    let allBooks=await Book.find()
    let allUsers=await User.find()

    res.render("readers.ejs", {allBooks,allUsers})
  }catch(err){
    console.log(err)
  }
})

app.delete("/readers/remove/:id",async (req,res)=>{
  try{
    let {id}=req.params;
    await User.findByIdAndDelete(id)
    res.redirect("/readers")
  }catch(err){
    console.log(err)
    res.send("Internal server error")
  }
})

app.get("/newbook",(req,res)=>{
  res.render("newBook.ejs")
})

app.post("/newbook", async (req, res) => {
  try {
    let { title, author, copies } = req.body;

    console.log("Received Data:", { title, author, copies });

    
    let copiesAvailable = parseInt(copies);

    
    let newBook = await Book.insertMany([{ title, author, copiesAvailable }]);

    console.log("Book Added Successfully:", newBook);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error Adding Book:", err);
    res.status(500).send("Failed to add book.");
  }
});



app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user already exists
    let existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash("error", "Username already taken! Try another one.");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    await User.insertMany([{ username, password: hashedPassword }]);

    console.log("User Registered Successfully!");
    
    res.redirect("/auth");

  } catch (err) {
    console.error("Registration Error:", err);
   
    res.redirect("/register");
  }
});



