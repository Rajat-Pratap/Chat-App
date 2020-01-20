const express= require('express')
const http= require('http')
const socketio=require('socket.io')
const path= require('path')
const Filter = require('bad-words')
const {generateMessage, generateLocMessage}= require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom}= require('./utils/users')

const app= express()
const server = http.createServer(app)
const io= socketio(server)

const port=process.env.PORT || 3000
const publicDirectoryName=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryName))

const welcomeMessage= "Hello User!"

io.on('connection',(socket)=>{
    console.log('new socket connection')

    socket.on('broadcast',(msg,callback)=>{
        const filter = new Filter()
        const user=getUser(socket.id)

        if(filter.isProfane(msg)){
            return callback('Gaali Galoch!')
        }

        io.to(user.room).emit('sendMsg',generateMessage(user.username,msg))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)

        if(user){
            io.to(user.room).emit('sendMsg', generateMessage(`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',({lat,long},callback)=>{
        const user=getUser(socket.id)

        io.to(user.room).emit('sendLocationMsg',generateLocMessage(user.username,`https://google.com/maps?q=${lat},${long}`))
        callback()
    })

    socket.on('join',({username,room},callback)=>{
        const {error,user}= addUser({id: socket.id,username,room})

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('sendMsg',generateMessage(welcomeMessage))
        socket.broadcast.to(user.room).emit('sendMsg',generateMessage(`${user.username} has joined!`))

        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
    
        callback()
    })
})

server.listen(port,()=>{
    console.log(`Server is up and running on port ${port}!`)
})