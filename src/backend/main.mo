import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // ─── Types ───────────────────────────────────────────────────────────────
  type Question = {
    id : Nat;
    prompt : Text;
    choices : [Text];
    correctIndex : Nat;
  };

  type QuestionSet = {
    id : Nat;
    title : Text;
    creator : Principal;
    questions : [Question];
    isPublic : Bool;
  };

  type Blook = {
    name : Text;
    rarity : Text;
    cost : Nat;
  };

  type User = {
    id : Nat;
    name : Text;
    coins : Nat;
    xp : Nat;
  };

  type UserProfile = {
    name : Text;
    coins : Nat;
    xp : Nat;
    ownedBlooks : [Text];
    equippedBlook : ?Text;
  };

  type AdminUser = {
    id : Nat;
    name : Text;
    coins : Nat;
    xp : Nat;
    principalText : Text;
    suspended : Bool;
  };

  // Multiplayer
  type RoomMeta = {
    code : Text;
    questionSetId : Nat;
    host : Text;
    status : Text; // "waiting" | "active" | "finished"
    currentQuestion : Nat;
  };

  type RoomPlayerData = {
    name : Text;
    score : Nat;
    lastAnsweredQ : Int; // -1 means hasn't answered current question
  };

  type RoomPlayerInfo = {
    name : Text;
    score : Nat;
  };

  type RoomState = {
    code : Text;
    questionSetId : Nat;
    hostName : Text;
    players : [RoomPlayerInfo];
    status : Text;
    currentQuestion : Nat;
  };

  // ─── Authorization ────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─── Storage ──────────────────────────────────────────────────────────────
  let users = Map.empty<Principal, User>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let suspensions = Map.empty<Principal, Int>(); // expiry timestamp in nanoseconds

  let questionSets = Map.empty<Nat, QuestionSet>();
  var nextQuestionSetId = 0;

  let shopBlooks = Map.empty<Text, Blook>();

  // Multiplayer rooms
  let rooms = Map.empty<Text, RoomMeta>();
  let roomPlayerData = Map.empty<Text, RoomPlayerData>(); // key: "code:principalText"
  let roomPlayerList = Map.empty<Text, [Text]>(); // roomCode -> [principalText]

  // ─── Helpers ──────────────────────────────────────────────────────────────
  func isSuspended(p : Principal) : Bool {
    switch (suspensions.get(p)) {
      case (null) { false };
      case (?expiry) { Time.now() < expiry };
    };
  };

  // Generate a 6-char alphanumeric room code from a seed
  func makeRoomCode(seed : Nat) : Text {
    let codeChars : [Char] = [
      '0','1','2','3','4','5','6','7','8','9',
      'A','B','C','D','E','F','G','H','J','K',
      'L','M','N','P','Q','R','S','T','U','V',
      'W','X','Y','Z'
    ];
    let base : Nat = codeChars.size(); // 34
    var result : [Char] = [];
    // Use time + seed for more entropy
    var n = (Int.abs(Time.now()) + seed) % 1544804416; // 34^6 ~ 1.5B
    var i = 0;
    while (i < 6) {
      let idx = n % base;
      result := result.concat([codeChars[idx]]);
      n := n / base;
      i += 1;
    };
    Text.fromArray(result);
  };

  // ─── User Functions ───────────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (isSuspended(caller)) { Runtime.trap("Account suspended") };
    userProfiles.add(caller, profile);
    // Sync coins and xp to users map so leaderboard stays in sync
    switch (users.get(caller)) {
      case (?u) {
        users.add(caller, { id = u.id; name = u.name; coins = profile.coins; xp = profile.xp });
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func createUser(name : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (isSuspended(caller)) { Runtime.trap("Account suspended") };
    if (users.containsKey(caller)) { Runtime.trap("User already exists") };
    let newId = users.size();
    users.add(caller, { id = newId; name; coins = 100; xp = 0 });
    userProfiles.add(caller, { name; coins = 100; xp = 0; ownedBlooks = []; equippedBlook = null });
  };

  public query ({ caller }) func getUser() : async ?User {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    users.get(caller);
  };

  // ─── Admin Functions ──────────────────────────────────────────────────────
  public query ({ caller }) func getAllUsers() : async [AdminUser] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    let result = Map.empty<Nat, AdminUser>();
    for ((p, u) in users.entries()) {
      let au : AdminUser = {
        id = u.id;
        name = u.name;
        coins = u.coins;
        xp = u.xp;
        principalText = p.toText();
        suspended = isSuspended(p);
      };
      result.add(u.id, au);
    };
    result.values().toArray();
  };

  public shared ({ caller }) func giveCoins(userPrincipal : Principal, amount : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (users.get(userPrincipal)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) {
        users.add(userPrincipal, { id = u.id; name = u.name; coins = u.coins + amount; xp = u.xp });
        switch (userProfiles.get(userPrincipal)) {
          case (?p) {
            userProfiles.add(userPrincipal, { name = p.name; coins = p.coins + amount; xp = p.xp; ownedBlooks = p.ownedBlooks; equippedBlook = p.equippedBlook });
          };
          case (null) {};
        };
      };
    };
  };

  public shared ({ caller }) func giveCoinsToName(name : Text, amount : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    var found = false;
    for ((p, u) in users.entries()) {
      if (u.name == name and not found) {
        found := true;
        users.add(p, { id = u.id; name = u.name; coins = u.coins + amount; xp = u.xp });
        switch (userProfiles.get(p)) {
          case (?prof) {
            userProfiles.add(p, { name = prof.name; coins = prof.coins + amount; xp = prof.xp; ownedBlooks = prof.ownedBlooks; equippedBlook = prof.equippedBlook });
          };
          case (null) {};
        };
      };
    };
    if (not found) { Runtime.trap("User not found") };
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    users.remove(user);
    userProfiles.remove(user);
    suspensions.remove(user);
  };

  public shared ({ caller }) func suspendUser(user : Principal, hours : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    let expiryNs : Int = Time.now() + hours * 3_600_000_000_000;
    suspensions.add(user, expiryNs);
  };

  public shared ({ caller }) func unsuspendUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    suspensions.remove(user);
  };

  public query func isUserSuspended(user : Principal) : async Bool {
    isSuspended(user);
  };

  // ─── Question Sets ────────────────────────────────────────────────────────
  public shared ({ caller }) func submitQuestionSet(title : Text, questions : [Question]) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let qs : QuestionSet = { id = nextQuestionSetId; title; creator = caller; questions; isPublic = true };
    questionSets.add(nextQuestionSetId, qs);
    nextQuestionSetId += 1;
    qs.id;
  };

  public query func searchQuestionSets(search : Text) : async [QuestionSet] {
    let filtered = questionSets.values().filter(func(s) { s.title.contains(#text search) and s.isPublic });
    filtered.toArray();
  };

  public query ({ caller }) func getQuestionSet(id : Nat) : async ?QuestionSet {
    switch (questionSets.get(id)) {
      case (null) { null };
      case (?s) {
        if (s.isPublic or s.creator == caller or AccessControl.isAdmin(accessControlState, caller)) { ?s }
        else { Runtime.trap("Unauthorized") };
      };
    };
  };

  // ─── Shop ─────────────────────────────────────────────────────────────────
  public query func getShopBlooks() : async [(Text, Blook)] {
    shopBlooks.entries().toArray();
  };

  public shared ({ caller }) func addShopBlook(name : Text, cost : Nat, rarity : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    shopBlooks.add(name, { name; rarity; cost });
  };

  public shared ({ caller }) func buyBlook(blookName : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (shopBlooks.get(blookName)) {
      case (null) { Runtime.trap("Blook not found") };
      case (?blook) {
        switch (users.get(caller)) {
          case (null) { Runtime.trap("User not found") };
          case (?u) {
            if (u.coins < blook.cost) { Runtime.trap("Insufficient coins") };
            users.add(caller, { id = u.id; name = u.name; coins = u.coins - blook.cost; xp = u.xp });
            switch (userProfiles.get(caller)) {
              case (?p) {
                userProfiles.add(caller, { name = p.name; coins = p.coins - blook.cost; xp = p.xp; ownedBlooks = p.ownedBlooks.concat([blookName]); equippedBlook = p.equippedBlook });
              };
              case (null) {};
            };
          };
        };
      };
    };
  };

  // ─── Leaderboard ──────────────────────────────────────────────────────────
  public query func getLeaderboard() : async [User] {
    let all = users.values().toArray();
    let sorted = all.sort(func(a : User, b : User) : Order.Order {
      let scoreA : Nat = a.coins + a.xp;
      let scoreB : Nat = b.coins + b.xp;
      Nat.compare(scoreB, scoreA);
    });
    if (sorted.size() <= 20) { sorted } else { sorted.sliceToArray(0, 20) };
  };

  // ─── Multiplayer Rooms ────────────────────────────────────────────────────
  public shared ({ caller }) func createRoom(questionSetId : Nat) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let seed = users.size() + nextQuestionSetId;
    let code = makeRoomCode(seed);
    let hostName = switch (users.get(caller)) {
      case (?u) { u.name };
      case (null) { "Host" };
    };
    let meta : RoomMeta = { code; questionSetId; host = caller.toText(); status = "waiting"; currentQuestion = 0 };
    rooms.add(code, meta);
    let playerKey = code # ":" # caller.toText();
    roomPlayerData.add(playerKey, { name = hostName; score = 0; lastAnsweredQ = -1 });
    roomPlayerList.add(code, [caller.toText()]);
    code;
  };

  public shared ({ caller }) func joinRoom(code : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.status != "waiting") { Runtime.trap("Game already started") };
        let pText = caller.toText();
        let playerKey = code # ":" # pText;
        if (roomPlayerData.containsKey(playerKey)) { Runtime.trap("Already in room") };
        let playerName = switch (users.get(caller)) {
          case (?u) { u.name };
          case (null) { "Player" };
        };
        roomPlayerData.add(playerKey, { name = playerName; score = 0; lastAnsweredQ = -1 });
        switch (roomPlayerList.get(code)) {
          case (?list) { roomPlayerList.add(code, list.concat([pText])) };
          case (null) { roomPlayerList.add(code, [pText]) };
        };
      };
    };
  };

  public shared ({ caller }) func startRoom(code : Text) : async () {
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.host != caller.toText()) { Runtime.trap("Only host can start") };
        rooms.add(code, { code = room.code; questionSetId = room.questionSetId; host = room.host; status = "active"; currentQuestion = 0 });
      };
    };
  };

  public query func getRoomState(code : Text) : async ?RoomState {
    switch (rooms.get(code)) {
      case (null) { null };
      case (?room) {
        let playerPrincipals = switch (roomPlayerList.get(code)) {
          case (?list) { list };
          case (null) { [] };
        };
        let playerInfos = playerPrincipals.map(func(pText : Text) : RoomPlayerInfo {
          let key = code # ":" # pText;
          switch (roomPlayerData.get(key)) {
            case (?pd) { { name = pd.name; score = pd.score } };
            case (null) { { name = "?"; score = 0 } };
          };
        });
        let hostName = switch (roomPlayerData.get(code # ":" # room.host)) {
          case (?pd) { pd.name };
          case (null) { "Host" };
        };
        ?{ code = room.code; questionSetId = room.questionSetId; hostName; players = playerInfos; status = room.status; currentQuestion = room.currentQuestion };
      };
    };
  };

  public shared ({ caller }) func submitRoomAnswer(code : Text, questionIdx : Nat, answerIdx : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.status != "active") { Runtime.trap("Game not active") };
        if (questionIdx != room.currentQuestion) { Runtime.trap("Wrong question") };
        let pText = caller.toText();
        let playerKey = code # ":" # pText;
        switch (roomPlayerData.get(playerKey)) {
          case (null) { Runtime.trap("Not in room") };
          case (?pd) {
            if (pd.lastAnsweredQ >= 0 and Int.abs(pd.lastAnsweredQ) == questionIdx) {
              Runtime.trap("Already answered");
            };
            switch (questionSets.get(room.questionSetId)) {
              case (null) {};
              case (?qs) {
                if (questionIdx < qs.questions.size()) {
                  let q = qs.questions[questionIdx];
                  let bonus : Nat = if (answerIdx == q.correctIndex) { 100 } else { 0 };
                  roomPlayerData.add(playerKey, { name = pd.name; score = pd.score + bonus; lastAnsweredQ = questionIdx });
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func nextQuestion(code : Text) : async () {
    switch (rooms.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.host != caller.toText()) { Runtime.trap("Only host can advance") };
        switch (questionSets.get(room.questionSetId)) {
          case (null) { Runtime.trap("Question set not found") };
          case (?qs) {
            let nextQ = room.currentQuestion + 1;
            let newStatus = if (nextQ >= qs.questions.size()) { "finished" } else { room.status };
            rooms.add(code, { code = room.code; questionSetId = room.questionSetId; host = room.host; status = newStatus; currentQuestion = nextQ });
          };
        };
      };
    };
  };

  public shared ({ caller }) func leaveRoom(code : Text) : async () {
    let pText = caller.toText();
    let playerKey = code # ":" # pText;
    roomPlayerData.remove(playerKey);
    switch (roomPlayerList.get(code)) {
      case (?list) {
        roomPlayerList.add(code, list.filter(func(p : Text) : Bool { p != pText }));
      };
      case (null) {};
    };
  };
};
