let fs = require("fs"),
    express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),

    // Все namespaces
    nspChat = io.of("/chat");
    nspAll = [nspChat];


server.listen(3000, "192.168.1.104");
app.set("view engine", "ejs");
app.use("/static", express.static("./sources/static"));

// Комнаты (правильная структура)
// "d2@3da@D@2d2d!3": { sockets: [], maxUsers: 5 }
let socketInRooms = [
  { gameName: "Dota 2", allRooms: {} },
  { gameName: "CS Go", allRooms: {} },
  { gameName: "Lost Castle", allRooms: {} },
  { gameName: "Castle Crashers", allRooms: {} },
  { gameName: "Magicka 2", allRooms: {} },
  { gameName: "Borderlands 2", allRooms: {} },
  { gameName: "Portal 2", allRooms: {} }
];

// let socketInRooms = [
//   {gameName: "Dota 2", sockets: [], allRooms: [], maxUsers: 5},
//   {gameName: "CS Go", sockets: [], allRooms: [], maxUsers: 2},
//   {gameName: "Lost Castle", sockets: [], allRooms: [], maxUsers: 4},
//   {gameName: "Castle Crashers", sockets: [], allRooms: [], maxUsers: 4},
//   {gameName: "Magicka 2", sockets: [], allRooms: [], maxUsers: 4},
//   {gameName: "Borderlands 2", sockets: [], allRooms: [], maxUsers: 2},
//   {gameName: "Portal 2", sockets: [], allRooms: [], maxUsers: 2}
// ];

// Cписок игр и число игроков
let gameAll = {};
Object.keys(socketInRooms).forEach((item)=> {
  gameAll[socketInRooms[item].gameName] = 3;
});

// Главная страница
app.get("/", (req, res) => {
  // Послать ответ
  res.render(`${__dirname}/sources/template/index`,
    {gameAll: gameAll}
  );
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
  let socketInRooms_item;

  userInfoPromise.then((userInfo)=> {


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

      if(checkQuantity) {
        elem["allRooms"][roomName]["sockets"].push(socket.client.id);
        let indexLast = Object.keys(elem.allRooms).length - 1,
          elemRoomName = Object.keys(elem.allRooms)[indexLast];

        console.log(`Добавляем в комнату: ${elemRoomName}`);
        socket.join(elemRoomName);
      }
    };


    // Создание новой комнаты
    let createNewRoom = (elem, roomName, maxUsers) => {
      elem["allRooms"][roomName] = { sockets: [], maxUsers: maxUsers }
    }


    // Создание имя комнаты
    let createNameRoom = (elem) => {
      let roomName = `${elem["gameName"]}#${socket.client.id}`;
      roomName = roomName.replace(" ", "");
      return roomName;
    }


    // Логика добавления в комнату
    socketInRooms.forEach((elem) => {
      if (elem["gameName"] == userInfo["gameName"]) {
        socketInRooms_item = elem;

        // Создаем комнаты
        let roomsCount = Object.keys(elem["allRooms"]).length;

        // Название последней созданной комнаты
        let roomNameLast, roomMaxUsers;
        let roomsMaxUsersCheck = 0;

        if (roomsCount > 0) {
          roomNameLast = findNameLastRoom(elem);
          roomMaxUsers = elem["allRooms"][roomNameLast]["maxUsers"];
          roomsMaxUsersCheck = roomMaxUsers < userInfo["usersAmount"];

          console.log(`
            Название последней комнаты: ${roomNameLast} \n
            Массивчик сокетов: ${elem["allRooms"][roomNameLast]["sockets"]} \n
            maxUsers: ${roomMaxUsers}
          `);
        }

        if (roomsCount == 0 || roomsMaxUsersCheck < userInfo["usersAmount"]) {
          let roomName = createNameRoom(elem);
          createNewRoom(elem, roomName, 3);
          addNewUserOnRoom(elem, roomName);
          tellAboutNewUser(elem);

          // Для последующих пользователей
          roomNameLast = findNameLastRoom(elem);
          maxUsers = elem["allRooms"][roomNameLast]["maxUsers"];
          console.log(`Макс. число юзеров ${maxUsers}`);
        }

        else if (elem["allRooms"][roomNameLast]["sockets"].length < roomMaxUsers) {
          console.log("Последующие пользователи");
          socket.join(roomNameLast);
          tellAboutNewUser(elem);
          addNewUserOnRoom(elem, roomNameLast);
        }
        else {
          let roomName = createNameRoom(elem);
          createNewRoom(elem, roomName, 3);
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


  });

  socket.on("disconnect", (data) => {
    let belongRoomName = Object.keys(socket.rooms),
      checkRoom = belongRoomName.length > 0,
      socketId = socket.client.id;

      if(socketInRooms_item !== "undefined") {
        let indexId = socketInRooms_item["sockets"].indexOf(socketId);
      }

    // При отключении, выкидывает сокет из массива сокетов комнаты
    if (checkRoom) {
      socket.leave(belongRoomName[1]);
      if (indexId >= 0) arr.splice( socketId, 1 );
    }
    console.log("Отключились ahegao");
  });
});
