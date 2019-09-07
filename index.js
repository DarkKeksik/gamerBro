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
// "d2@3da@D@2d2d!3": { sockets: [], maxUsers: 5 }
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

//        console.log(`
//      "От пользователя: \n
//      ${userInfo["name"]} \n
//      ${userInfo["gameName"]} \n
//      ${userInfo["usersAmount"]}
//    `);


        // При подключении нового клиента к чату, говорим об этом
        let tellAboutNewUser = (elem, maxUsers) => {
            
            let roomNameLast = findNameLastRoom(maxUsers);
            nspChat.to( roomNameLast ).emit("connectNewUser", {
                name: userInfo["name"]
            });
        };
        
        // Находим все комнаты с определенным max кол-вом пользователей
        let findAllRooms = (elem, maxUsers) => {
            let resultArr = [];
            Object.keys(elem["allRooms"]).forEach((item) => {                
                var maxUsersChech = socketInRooms[0]["allRooms"][item]["maxUsers"];
                if (maxUsersChech == maxUsers) {
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
//            console.log(`Тестируем последную найденную комнату ${roomsMaxUsersValid} (в массиве)`);
//            console.log(`Тестируем последную найденную комнату ${roomNameLastKey} (в результате)`);
            return roomNameLastKey;
        }


        // Добавление нового пользователя в комнату
        let addNewUserOnRoom = (elem, roomName, maxUsers) => {
            let maxUsersInsideFunc = maxUsers;
            let roomNameLast = findNameLastRoom(maxUsersInsideFunc),
                checkQuantity = elem["allRooms"][roomNameLast]["sockets"];

            if (checkQuantity) {
                elem["allRooms"][roomName]["sockets"].push(socket.client.id);
                let indexLast = Object.keys(elem.allRooms).length - 1,
                    elemRoomName = Object.keys(elem.allRooms)[indexLast];

//                console.log(`Добавляем в комнату: ${elemRoomName}`);
                socket.join(elemRoomName);
            }
        };


        // Создание новой комнаты
        let createNewRoom = (elem, roomName, maxUsers) => {
            elem["allRooms"][roomName] = {
                sockets: [],
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
                let roomNameLast, roomMaxUsers, roomsMaxUsersCheck;

                // Создаем комнаты 
                if (roomsCount > 0) {
                    roomNameLast = findNameLastRoom(userInfo["usersAmount"]);
                    roomMaxUsers = elem["allRooms"][roomNameLast]["maxUsers"];                    
                    roomsMaxUsersCheck = roomMaxUsers != userInfo["usersAmount"];
                }
                
                if (roomsCount == 0 || roomsMaxUsersCheck) {
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, roomName, userInfo["usersAmount"]);
                    tellAboutNewUser(elem, userInfo["usersAmount"]);

                    // Для последующих пользователей
//                    maxUsers = elem["allRooms"][roomNameLast]["maxUsers"];
                }
                
                else if (elem["allRooms"][roomNameLast]["sockets"].length < roomMaxUsers) {
                    socket.join(roomNameLast);
                    tellAboutNewUser(elem, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, roomNameLast, userInfo["usersAmount"]);
                } else {
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, roomName, userInfo["usersAmount"]);
                    tellAboutNewUser(elem, userInfo["usersAmount"]);
                }
            }
        });

        // Клиент -> сервер
        socket.on("send mess", (data) => {
            let belongRoomName = findNameLastRoom(userInfo["usersAmount"]);
            console.log(belongRoomName);
            // Сервер -> клиент
            nspChat.to(belongRoomName).emit("add mess", {
                name: userInfo["name"],
                msg: data
            });
        });


        socket.on("disconnect", (data) => {

            // Ликвидируем предателя
            let socketId = socket.client.id;
            socketInRooms.forEach((item) => {
                let allRoomsOnGame = item["allRooms"],
                    allRoomsOnGame_keys = Object.keys(allRoomsOnGame);

                // Проходим все комнаты для нахождения сокетов
                allRoomsOnGame_keys.forEach((item) => {
                    console.log(`item: ${item}`);
                    let allRoomsOnGame_sockets = allRoomsOnGame[item]["sockets"];
                    console.log(`allRoomsOnGame[item]: ${allRoomsOnGame[item]}`);
                    let allRoomsOnGame_socketPosition = allRoomsOnGame_sockets.indexOf(socketId);

                    // Удаляем из массива отключившийся сокет
                    if (allRoomsOnGame_socketPosition > -1) {
                        allRoomsOnGame_sockets.splice(allRoomsOnGame_socketPosition, 1);

                        // Говорим об этом членам комнаты
                        nspChat.to(item).emit("disconnectUser", {
                            name: userInfo["name"]
                        });

                        socket.leave(item);
                    }
                });
            });
            console.log("Отключились ahegao");
        });


    });
});