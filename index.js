const { response } = require("express");
const http = require("http");
const app = require("express")();
app.get("/",(req, res)=>  res.sendFile(__dirname+"/index.html"));
app.listen(9091, ()=> console.log("Listening on http port 9091...."));
const websocketServer = require("websocket").server;
const httpserver = http.createServer();
httpserver.listen(9090, ()=> console.log("Listening on 9090 ..."))

const wsServer = new websocketServer({
    "httpServer": httpserver,
})
//client hashmap
const clients ={};
const games ={};
wsServer.on("request", request =>{
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", ()=> console.log("Connection Opened!"));
    connection.on("close", ()=> console.log("Connection Closed!"));
    connection.on("message",message=>{
        const result = JSON.parse(message.utf8Data);
        // I have received a message from client
        //if a user want to create a new game
        if(result.method == "create"){
            const clientID = result.clientID;
            const gameID = guid();

            games[gameID] = {
                "id": gameID,
                "balls":9,
                "clients":[]
            
            }

            const payload = {
                "method": "create",
                "game": games[gameID]
            }

            const con = clients[clientID].connection;
            con.send(JSON.stringify(payload));
        }

        if(result.method == "join"){
            const clientID = result.clientID;
            const gameID = result.gameID;
            const game = games[gameID];
          
            if(game.clients.length >=3 ){
                return;
            }
            const color = {"0":"Red", "1":"Green","2":"Blue"}  [game.clients.length];
            game.clients.push({
                "clientID": clientID,
                "color": color,
            })
            if(game.clients.length ==3 ) updateGameState();
            const payload = {
                "method" : "join",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientID].connection.send(JSON.stringify(payload))
            });
        }

        //a user plays
        if (result.method === "play") {
            const gameID = result.gameID;
            const ballID = result.ballID;
            const color = result.color;
            let state = games[gameID].state;
            if (!state)
                state = {}
            
            state[ballID] = color;
            games[gameID].state = state;
            
        }

    });


    function updateGameState(){

        //{"gameid", fasdfsf}
        for (const g of Object.keys(games)) {
            const game = games[g]
            const payload = {
                "method": "update",
                "game": game
            }
    
            game.clients.forEach(c=> {
                clients[c.clientID].connection.send(JSON.stringify(payload))
            })
        }
    
        setTimeout(updateGameState, 100);
    }
    

    //generate a new clien id
    const clientID = guid();
    clients[clientID] = {
        "connection": connection,

    };

    const payload = {
        "method": "connect",
        "clientID" :clientID,

    }

    //send back the client connect
    connection.send(JSON.stringify(payload));


})

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 