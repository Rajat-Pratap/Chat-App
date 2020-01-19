const socket= io()
const form=document.querySelector('#message-form')
const input=form.querySelector('input')
const button=form.querySelector('button')
const locButton= document.querySelector('#send-loc')
const messages= document.querySelector('#messages')

//templates
const messageTemplate= document.querySelector('#message-template').innerHTML
const locMsgTemplate= document.querySelector('#location-template').innerHTML
const sidebarTemplate= document.querySelector('#sidebar-template').innerHTML

//options
const {username,room}= Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoscroll=()=>{
    //new message element
    const newMessage=messages.lastElementChild

    //height of new msg
    const newMessageStyles=getComputedStyle(newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight= newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight=messages.offsetHeight

    //height of message container
    const containerHeight=messages.scrollHeight

    //how far has user scrolled?
    const scrollOffset=messages.scrollTop+visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        messages.scrollTop=messages.scrollHeight
    }
}

socket.on('sendMsg',(message)=>{
    console.log(message)
    const html= Mustache.render(messageTemplate,{
        username: message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('sendLocationMsg',(urlObj)=>{
    console.log(urlObj.url)
    const html= Mustache.render(locMsgTemplate,{
        username: urlObj.username,
        url:urlObj.url,
        createdAt: moment(urlObj.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
     const html=Mustache.render(sidebarTemplate,{
         room,
         users
     })
     document.querySelector('#sidebar').innerHTML=html
})

form.addEventListener('submit',(e)=>{
    e.preventDefault()

    form.setAttribute('disabled','disabled')

    socket.emit('broadcast',e.target.elements.message.value,(error)=>{
        button.removeAttribute('disabled')
        input.value=''
        input.focus()

        if(error)
            return console.log(error)
        

        console.log('Message Delivered.')
    })
})

document.querySelector('#send-loc').addEventListener('click',(e)=>{
    if(!navigator.geolocation)
        return alert('geolocation is not supported')
    locButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position)
        socket.emit('sendLocation',{
            lat:  position.coords.latitude,
            long: position.coords.longitude
        },()=>{
            locButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    },()=>{
        socket.emit('sendLocation',{
            lat:  0,
            long: 0
        },()=>{
            locButton.removeAttribute('disabled')
            console.log('Sending random Location.')
        })
    },{timeout:15000})
})

socket.emit('join',{username,room},(error)=>{
    if(error)
    {
        alert(error)
        location.href='/'
    }
})