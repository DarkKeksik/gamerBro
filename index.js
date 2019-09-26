let fs = require("fs"),
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),

    // Все namespaces
    nspChat = io.of("/chat");
nspAll = [nspChat];


server.listen(3000, "172.31.45.177");
app.set("view engine", "ejs");
app.use("/static", express.static("./sources/static"));

// Комнаты (правильная структура) 
// "d2@3da@D@2d2d!3": { sockets: {}, maxUsers: 5 }
let socketInRooms = [
    {
        gameName: "Dota 2",
        allRooms: {},
        maxUsersDefault: 5
    },
    {
        gameName: "CS Go",
        allRooms: {},
        maxUsersDefault: 4
    },
    {
        gameName: "Lost Castle",
        allRooms: {},
        maxUsersDefault: 4
    },
    {
        gameName: "Castle Crashers",
        allRooms: {},
        maxUsersDefault: 4
    },
    {
        gameName: "Magicka 2",
        allRooms: {},
        maxUsersDefault: 4
    },
    {
        gameName: "Borderlands 2",
        allRooms: {},
        maxUsersDefault: 2
    },
    {
        gameName: "Portal 2",
        allRooms: {},
        maxUsersDefault: 2
    }
];


// Cписок игр и число игроков
let gameAll = {};

Object.keys(socketInRooms).forEach((item) => {
    let gameName = socketInRooms[item]["gameName"],
        maxUsersDefault = socketInRooms[item]["maxUsersDefault"];

    gameAll[gameName] = maxUsersDefault;
});

// Главная страница
app.get("/", (req, res) => {
    // Послать ответ
    res.render(`${__dirname}/sources/template/index`, {
        gameAll: gameAll
    });
});


// Функции
// Для проверки от xxs
let protectedXXS = (string) => {
    let htmlEscapes = {
        '&': ' ',
        '<': ' ',
        '>': ' ',
        '"': ' ',
        "'": " "
    };

    return string.replace(/[&<>"']/g, (match) => {
        return htmlEscapes[match];
    });
};


// При подключении клиента
nspChat.on("connection", (socket) => {
    console.log("Успешно подключились !");
    console.log(Object.keys(nspChat.connected));

    // Получаем информацию о пользователе от клиента
    let userInfoPromise = new Promise((resolve, reject) => {
        socket.on("getInfoByUser", (data) => {
            resolve(data);
        });
    });

    // Добавляем id сокета в масиив
    let socketInRooms_item, userInfo;
    
    userInfoPromise.then((userInfo) => {
        let allUsersOnRoom = (elem, maxUsers) => {
            let maxUsersInside = maxUsers;
            let roomNameLast = findNameLastRoom(maxUsersInside);
            
            // Имитируем событие
            nspChat.to( roomNameLast ).emit("usersOnRoom", {
                usersOnRoom: elem["allRooms"][roomNameLast]["sockets"]
            });
        }
        
        // При подключении нового клиента к чату, говорим об этом
        let tellAboutNewUser = (maxUsers) => {
            
            let roomNameLast = findNameLastRoom(maxUsers);
            nspChat.to( roomNameLast ).emit("connectNewUser", {
                name: userInfo["name"]
            });
        };
        
        // Находим все комнаты с определенным кол-вом пользователей 
        let findAllRooms = (elem, maxUsers) => {
            let resultArr = [];

            Object.keys(elem["allRooms"]).forEach((item) => {
                console.log("test", item);
                var maxUsersCheck = elem["allRooms"][item]["maxUsers"];
                if (maxUsersCheck == maxUsers) {
                    resultArr.push(item);
                }
            });
            
            return resultArr;
        }


        // Узнаем название последней созданной комнаты
        let findNameLastRoom = (maxUsers) => {
            
            let roomsMaxUsersValid = [];
            socketInRooms.forEach((elemAllRooms) => {
                let allRooms = Object.keys(elemAllRooms["allRooms"]);

                allRooms.forEach((elemNameRoom) => {
                    let itemRoom = elemAllRooms["allRooms"][elemNameRoom];
                    let itemRoomMaxUsers = elemAllRooms["allRooms"][elemNameRoom]["maxUsers"];
                    if (itemRoomMaxUsers == maxUsers) {
                        console.log(`Тестируем последную найденную комнату ${elemNameRoom}`);
                        roomsMaxUsersValid.push(elemNameRoom);
                    }
                });
            });
            
            // Из полученного массива комнат, получаем последний
            let roomNameLastKey = roomsMaxUsersValid[Object.keys(roomsMaxUsersValid).length-1];
            return roomNameLastKey;
        }


        // Добавление нового пользователя в комнату
        let addNewUserOnRoom = (elem, maxUsers) => {
            let maxUsersInside = maxUsers;
            let roomNameLast = findNameLastRoom(maxUsersInside);
            
            elem["allRooms"][roomNameLast]["sockets"][socket.client.id] = userInfo["name"];
            socket.join(roomNameLast);
        };


        // Создание новой комнаты
        let createNewRoom = (elem, roomName, maxUsers) => {
            elem["allRooms"][roomName] = {
                sockets: {},
                maxUsers: maxUsers
            }
            console.log(`Проверяем кол-во человек в комнате ${maxUsers}`);
        }


        // Создание имя комнаты
        let createNameRoom = (elem, maxUsers) => {
            let roomName = `${elem["gameName"]}#${socket.client.id}user${maxUsers}`;
            roomName = roomName.replace(" ", "");
            return roomName;
        }


        // Логика добавления в комнату
        socketInRooms.forEach((elem) => {
            
            // Если название игры совпадает, то продолжаем
            if (elem["gameName"] == userInfo["gameName"]) {
                socketInRooms_item = elem;

                // Кол-во раннее созданных комнат
                let roomsCount = findAllRooms(elem, userInfo["usersAmount"]).length;

                // Название последней созданной комнаты 
                let roomNameLast, roomUsersMax, roomsMaxUsersCheck, roomUsersNow;

                // Если была созданна хоть одна любая комната
                if (roomsCount > 0) {
                    roomNameLast = findNameLastRoom(userInfo["usersAmount"]);
                    roomUsersMax = elem["allRooms"][roomNameLast]["maxUsers"];                    
                    roomsMaxUsersCheck = roomUsersMax != userInfo["usersAmount"];
                    roomUsersNow = Object.keys(elem["allRooms"][roomNameLast]["sockets"]).length;
                }
                
                // Создаем новую комнату или добавляем
                if ( (roomsCount == 0 || roomsMaxUsersCheck) || (roomUsersNow >= roomUsersMax) ) {
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, userInfo["usersAmount"]);
                    allUsersOnRoom(elem, userInfo["usersAmount"]);
                    tellAboutNewUser(userInfo["usersAmount"]);
                } else {
                    addNewUserOnRoom(elem, userInfo["usersAmount"]);
                    allUsersOnRoom(elem, userInfo["usersAmount"]);
                    tellAboutNewUser(userInfo["usersAmount"]);
                }
            }
        });
        
        // Отправляем сообщение всем пользователям в комнате
        let sentMessage = (socketId) => {
            // Сюда результат
            let roomName;
            
            socketInRooms.forEach((elemAllRooms) => {
                let allRooms = Object.keys(elemAllRooms["allRooms"]);

                allRooms.forEach((elemNameRoom) => {
                    let itemRoom = elemAllRooms["allRooms"][elemNameRoom];
                    let itemRoomSockets = Object.keys(elemAllRooms["allRooms"][elemNameRoom]["sockets"]);
                    
                    // Находим первую принадлежность сокета к комнате
                    itemRoomSockets.forEach((socketItem) => {
                        if ( socketItem == socketId ) {
                            roomName = elemNameRoom;
                        }
                    });
                });
            });
            
            return roomName;
        }

        // Сообщение клиент -> сервер
        socket.on("send mess", (data) => {
            let belongRoomName = sentMessage(socket.client.id);
            console.log("Id сокета ", socket.client.id);
            console.log("Отправляем в комнату: ", belongRoomName );
            
            let dataClear = protectedXXS(data);
            
            // Сервер -> клиент
            nspChat.to(belongRoomName).emit("add mess", {
                name: userInfo["name"],
                msg: dataClear
            });
        });
        
        socket.on("disconnect", (data) => {

            // Ликвидируем предателя
            let socketId = socket.client.id;
            socketInRooms.forEach((itemGame) => {
                let allRoomsOnGame = itemGame["allRooms"],
                    allRoomsOnGame_keys = Object.keys(allRoomsOnGame);

                
                // Проходим все комнаты для нахождения сокетов
                allRoomsOnGame_keys.forEach((item) => {
                    let allRoomsOnGame_sockets = allRoomsOnGame[item]["sockets"];
                    let allRoomsOnGame_socketsKeys = Object.keys(allRoomsOnGame_sockets);
                    let allRoomsOnGame_socketPosition = allRoomsOnGame_socketsKeys.indexOf(socketId);
                    
                    if (allRoomsOnGame_socketPosition > -1) {
                        // Удаляем из массива отключившийся сокет
                        delete(allRoomsOnGame_sockets[socketId]);

                        // Говорим об этом членам комнаты
                        nspChat.to(item).emit("disconnectUser", {
                            name: userInfo["name"]
                        });
                        
                        // Удаляем из комнаты
                        socket.leave(item);
                        
                        // Показываем остальным сокетам кто в комнате
                        nspChat.to( item ).emit("usersOnRoom", {
                            usersOnRoom: itemGame["allRooms"][item]["sockets"]
                        });
                    }
                });
            });
            console.log("Отключились ahegao");
        });


    });
});