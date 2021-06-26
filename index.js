const express = require('express')
const app = express();
const cors = require('cors');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
// const fileUpload =require('express-fileUpload');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());

app.use(express.static('blogImg')); //doctors folder e rakhbo tai ekhane doctors likhechi
// app.use(fileUpload());


app.get('/', (req, res) => {
  res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.stbya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const adminCollection = client.db(`${process.env.DB_NAME}`).collection("admin");
  const blogCollection = client.db(`${process.env.DB_NAME}`).collection("blogs");



// blog er details upload
  app.post('/addBlogs',(req, res) =>{
    const file = req.files.file;
    const blogTitle = req.body.blogTitle;
    const blogContent = req.body.blogContent;
    console.log(blogTitle,blogContent,file);

    
    const filePath = `${__dirname}/blogImg/${file.name}`;

    file.mv(filePath,err =>{
      if(err){
        console.log(err);
        return res.status(500).send({message:'Failed to upload image'});
      }
      var newImg = fs.readFileSync(filePath);
      // var newImg = file.data;
      const encodedImg = newImg.toString('base64');

      var image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer(encodedImg, 'base64')
        // img: Buffer.from(encodedImg, 'base64')
    };

      blogCollection.insertOne({blogTitle,blogContent, image})
      .then(result =>{
        fs.remove(filePath,error =>{
          if(error){
            console.log(error);
            res.status(500).send({message:'Failed to upload image'});
          }
          res.send(result.insertedCount > 0)
        })     
      })
      // return res.send({name:file.name,path:`/${file.name}`})
    })
  
  })

// get blogs
app.get('/blogs', (req, res) => {
  blogCollection.find({})
      .toArray((err, documents) => {
          res.send(documents);
      })
});
  
app.get('/blogs/:id', (req, res) => {
  const id = ObjectId(req.params.id);
  blogCollection.find(id)
  .toArray((err,items) => {
    res.send(items);
  })
})



app.delete('/deleteBlogs/:id',(req, res) => {
  const id = ObjectId(req.params.id);
  blogCollection.deleteOne({_id: id})
  .then(documents => {
    console.log(documents);
    res.send(documents.deletedCount > 0);
  })
})



// get admin
app.get('/admins', (req, res) => {
    adminCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
});




//To see admin or not
app.post('/isAdmin', (req,res)=> {
    const email = req.body.email;
    // const password = req.body.password;
    adminCollection.find({ email : email})
    .toArray((err,admin) =>{
      res.send(admin.length > 0);
    })
  })


});





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})