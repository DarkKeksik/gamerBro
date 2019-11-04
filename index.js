let fs = require("fs"),
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),

    // Все namespaces
    nspChat = io.of("/chat"),
    nspAllUsers = io.of("/allUsers");
nspAll = [nspChat, nspAllUsers];


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


// Cписок игр, макс. число игроков и кол-во всех пользователей в играх
let gamesList = (socketInRooms) => {
    let gamesAll = {};

    Object.keys(socketInRooms).forEach((item) => {
        let gameName = socketInRooms[item]["gameName"],
            maxUsersDefault = socketInRooms[item]["maxUsersDefault"],
            allRooms = socketInRooms[item]["allRooms"];

        // Собираем кол-во всех пользователей в игре
        let allUsersNow = 0;
        Object.keys(allRooms).forEach((item) => {
            allUsersNow += Object.keys(allRooms[item]["sockets"]).length;
        });
//        console.log("В игре ", gameName, " пользователей: ", allUsersNow);

        gamesAll[gameName] = {
            "maxUsersDefault": maxUsersDefault,
            "allUsersNow": allUsersNow
        };
    });

    return gamesAll;
}


// Главная страница
app.get("/", (req, res) => {
    let gamesAll = gamesList(socketInRooms);

    // Послать ответ
    res.render(`${__dirname}/sources/template/index`, {
        gamesAll: gamesAll
    });
    // let ip = req.connection.remoteAddress;
});


// Пользователи чата
nspChat.on("connection", (socket) => {
//    console.log("Успешно подключились !");
//    console.log(Object.keys(nspChat.connected));

    // Получаем информацию о пользователе от клиента
    let userInfoPromise = new Promise((resolve, reject) => {
        socket.on("getInfoByUser", (data) => {
            resolve(data);
        });
    });

    // Добавляем id сокета в масиив
    let socketInRooms_item, userInfo;

    userInfoPromise.then((userInfo) => {
        
        console.log("Что прислал пользовательтель? \n", userInfo);
        
        let allUsersOnRoom = (elem, maxUsers) => {
            let maxUsersInside = maxUsers;
            let roomNameLast = findNameLastRoom(maxUsersInside);

            // Имитируем событие
            nspChat.to(roomNameLast).emit("usersOnRoom", {
                usersOnRoom: elem["allRooms"][roomNameLast]["sockets"]
            });
        }

        // При подключении нового клиента к чату, говорим об этом
        let tellAboutNewUser = (maxUsers) => {

            let roomNameLast = findNameLastRoom(maxUsers);
            nspChat.to(roomNameLast).emit("connectNewUser", {
                name: userInfo["name"]
            });
        };

        // Находим все комнаты с определенным кол-вом пользователей 
        let findAllRooms = (elem, maxUsers) => {
            let resultArr = [];

            Object.keys(elem["allRooms"]).forEach((item) => {
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
            let roomNameLastKey = roomsMaxUsersValid[Object.keys(roomsMaxUsersValid).length - 1];
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

                // Создаем новую комнату или добавляем в существующую
                if ((roomsCount == 0 || roomsMaxUsersCheck) || (roomUsersNow >= roomUsersMax)) {
                    console.log("Создаем комнату: ",  userInfo["usersAmount"], " == ", roomUsersMax);
                    let roomName = createNameRoom(elem, userInfo["usersAmount"]);
                    createNewRoom(elem, roomName, userInfo["usersAmount"]);
                    addNewUserOnRoom(elem, userInfo["usersAmount"]);
                    allUsersOnRoom(elem, userInfo["usersAmount"]);
                    tellAboutNewUser(userInfo["usersAmount"]);
                } else {
                    console.log("Добавляем в комнату");
                    addNewUserOnRoom(elem, userInfo["usersAmount"]);
                    allUsersOnRoom(elem, userInfo["usersAmount"]);
                    tellAboutNewUser(userInfo["usersAmount"]);
                }
            }
        });

        // Показываем кол-во пользователей по играм
        nspAllUsers.emit("usersListUpdate", {
            usersList: gamesList(socketInRooms)
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
                        if (socketItem == socketId) {
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
            console.log("Отправляем в комнату: ", belongRoomName);

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
                        nspChat.to(item).emit("usersOnRoom", {
                            usersOnRoom: itemGame["allRooms"][item]["sockets"]
                        });
                    }
                });
            });


            // Показываем кол-во пользователей по играм
            nspAllUsers.emit("usersListUpdate", {
                usersList: gamesList(socketInRooms)
            });
            console.log("Отключились");
        });


    });
});