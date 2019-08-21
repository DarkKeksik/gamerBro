let fs = require("fs"),
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),

    // Все namespaces
    nspChat = io.of("/chat");
nspAll = [nspChat];


server.listen(3000, "192.168.1.102");
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
    console.log("Успешно подключились");
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

        console.log(`
      "От пользователя: \n
      ${userInfo["name"]} \n
      ${userInfo["gameName"]} \n
      ${userInfo["usersAmount"]}
    `);


        // При подключении нового клиента к чату, говорим об этом
        let tellAboutNewUser = (elem) => {
            let roomNameLastIndex = Object.keys(elem["allRooms"]).length - 1,
                roomNameLastKey = Object.keys(elem["allRooms"])[roomNameLastIndex];

            // Клиент, лови
            nspChat.to(roomNameLastKey).emit("connectNewUser", {
                name: userInfo["name"]
            });
        };


        // Узнаем название последней созданной комнаты
        let findNameLastRoom = (elem) => {
            let roomNameLastIndex = Object.keys(elem["allRooms"]).length - 1,
                roomNameLastKey = Object.keys(elem["allRooms"])[roomNameLastIndex];

            return roomNameLastKey;
        }


        // Добавление нового сокета в комнату
        let addNewUserOnRoom = (elem, roomName) => {
            let roomNameLast = findNameLastRoom(elem),
                checkQuantity = elem["allRooms"][roomNameLast]["sockets"];

            if (checkQuantity) {
                elem["allRooms"][roomName]["sockets"].push(socket.client.id);
                let indexLast = Object.keys(elem.allRooms).length - 1,
                    elemRoomName = Object.keys(elem.allRooms)[indexLast];

                console.log(`Добавляем в комнату: ${elemRoomName}`);
                socket.join(elemRoomName);
            }
        };


        // Создание новой комнаты
        let createNewRoom = (elem, roomName, maxUsers) => {
            elem["allRooms"][roomName] = {
                sockets: [],
                maxUsers: maxUsers
            }
        }


        // Создание имя комнаты
        let createNameRoom = (elem, maxUsers) => {
            let roomName = `${elem["gameName"]}#${socket.client.id}user${maxUsers}`;
            roomName = roomName.replace(" ", "");
            return roomName;
        }


        // Логика добавления в комнату
        socketInRooms.forEach((elem) => {
            if (elem["gameName"] == userInfo["gameName"]) {
                socketInRooms_item = elem;

                // Создаем комнаты
                let roomsCount = Object.keys(elem["allRooms"]).length;
                let roomNotExist = true;

                // Название последней созданной комнаты
                let roomNameLast, roomMaxUsers, roomsMaxUsersCheck;

                if (roomsCount > 0) {
                    roomNameLast = findNameLastRoom(elem);
                    roomMaxUsers = elem["allRooms"][roomNameLast]["maxUsers"];
                    roomsMaxUsersCheck = roomMaxUsers != userInfo["usersAmount"];
                    
                    // Если ранее была созданна комната, то присоединяемся к ней, иначе создаем
                    let roomsKeys = Object.keys(elem["allRooms"]);
                    elem["allRooms"].forEach((elem)=> {
                        console.log(`Проверка комнат: ${elem}`);
                    });
                }


                if (roomsCount == 0 || roomsMaxUsersCheck && roomNotExist) {
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, roomName);
                    tellAboutNewUser(elem);

                    // Для последующих пользователей
                    roomNameLast = findNameLastRoom(elem);
                    maxUsers = elem["allRooms"][roomNameLast]["maxUsers"];
                } else if (elem["allRooms"][roomNameLast]["sockets"].length < roomMaxUsers) {
                    socket.join(roomNameLast);
                    tellAboutNewUser(elem);
                    addNewUserOnRoom(elem, roomNameLast);
                } else {
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, roomName);
                    tellAboutNewUser(elem);
                }
            }
        });

        // Клиент -> сервер
        socket.on("send mess", (data) => {
            let belongRoomName = Object.keys(socket.rooms)[1];
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