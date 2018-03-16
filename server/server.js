const path=require('path');
const socketIO=require('socket.io');
const http=require('http');
var express=require('express');
var {generateMsg,generateLocationMsg}=require('./utils/message');
const {isRealString}=require('./utils/validation.js');
const {Users}=require('./utils/users');
const PublicPath=path.join(__dirname,'../public');
const port=process.env.PORT||3000;
var app=express();
var server=http.createServer(app);
var io=socketIO(server);
var users=new Users();
app.use(express.static(PublicPath));

io.on('connection',(socket)=>{
    console.log('New User Connected');

    socket.on('disconnect',()=>{
        var user=users.removeUser(socket.id);
        if(user){
            io.to(user.room).emit('updateUserList',users.getUserList(user.room));
            io.to(user.room).emit('newMsg',generateMsg('Admin',`${user.name} has left.`));
        }
    })

    socket.on('join',(params,callback)=>{
        if(!isRealString(params.name)|| !isRealString(params.room)){
            callback('Name and room name are required...');
        }
        socket.join(params.room);
        users.removeUser(socket.id);
        users.addUser(socket.id,params.name,params.room);

        io.to(params.room).emit('updateUserList',users.getUserList(params.room));

        socket.emit('newMsg',generateMsg('admin','Welcome to the chat app..'));
        socket.broadcast.to(params.room).emit('newMsg',generateMsg('admin',`${params.name} has joined..`));
        callback();
    })


    socket.on('createMsg',(newMsg,callback)=>{
        var user=users.getUser(socket.id);
        if(user && isRealString(newMsg.content)){
            io.emit('newMsg',generateMsg(newMsg.from,newMsg.content));
        }

       callback();
    })
    socket.on('createLocationMsg',(coords)=>{
        io.emit('newLocationMsg',generateLocationMsg('Admin',coords.latitude,coords.longitude));
    })
})

server.listen(port,()=>{
    console.log(`Server is started on port ${port}..`);
});