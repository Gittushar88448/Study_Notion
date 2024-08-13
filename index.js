const express = require('express');
const app = express();
require('dotenv').config();
const fileUpload = require('express-fileupload');
const userRouter = require('./routes/UserRoute');
const profileRouter = require('./routes/ProfileRoute');
const paymentRouter = require('./routes/PaymentRoute');
const courseRouter = require('./routes/CourseRoute');
const cookieParser = require('cookie-parser');
const {cloudinaryConnect} = require('./config/cloudinaryConnect');
const dbConnect = require('./config/database');
var cors = require('cors')

const PORT = process.env.PORT || 4000

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));


app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', userRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/course', courseRouter);
app.use('/api/v1/payment', paymentRouter);

let corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};
app.use(cors(corsOptions));

cloudinaryConnect();
dbConnect();

app.listen(PORT, ()=>{
    console.log(`app is running on port no.${PORT}`);
})

app.get('/', (req, res)=>{
    res.send(`<h1>Hello buddy welcome to study Notion</h1>`);
} )