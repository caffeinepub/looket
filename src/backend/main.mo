import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type Question = {
    id : Nat;
    prompt : Text;
    choices : [Text];
    correctIndex : Nat;
  };

  module QuestionSet {
    public type QuestionSet = {
      id : Nat;
      title : Text;
      creator : Principal;
      questions : [Question];
      isPublic : Bool;
    };

    public func compare(set1 : QuestionSet, set2 : QuestionSet) : Order.Order {
      Nat.compare(set1.id, set2.id);
    };
  };

  public type Blook = {
    name : Text;
    rarity : Text;
    cost : Nat;
  };

  module User {
    public type User = {
      id : Nat;
      name : Text;
      coins : Nat;
      xp : Nat;
    };

    public func compare(user1 : User, user2 : User) : Order.Order {
      Nat.compare(user1.id, user2.id);
    };
  };

  public type UserProfile = {
    name : Text;
    coins : Nat;
    xp : Nat;
    ownedBlooks : [Text];
    equippedBlook : ?Text;
  };

  // Initialize the authorization system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User storage
  let users = Map.empty<Principal, User.User>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Required profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createUser(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };

    if (users.containsKey(caller)) {
      Runtime.trap("User already exists");
    } else {
      let newId = users.size();
      let user : User.User = {
        id = newId;
        name;
        coins = 0;
        xp = 0;
      };
      users.add(caller, user);

      // Also create user profile
      let profile : UserProfile = {
        name;
        coins = 0;
        xp = 0;
        ownedBlooks = [];
        equippedBlook = null;
      };
      userProfiles.add(caller, profile);
    };
  };

  // Admin functions - using AccessControl
  public shared ({ caller }) func giveCoins(userPrincipal : Principal, amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can give coins");
    };

    switch (users.get(userPrincipal)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?user) {
        let updatedUser : User.User = {
          id = user.id;
          name = user.name;
          coins = user.coins + amount;
          xp = user.xp;
        };
        users.add(userPrincipal, updatedUser);

        // Update profile if exists
        switch (userProfiles.get(userPrincipal)) {
          case (?profile) {
            let updatedProfile : UserProfile = {
              name = profile.name;
              coins = profile.coins + amount;
              xp = profile.xp;
              ownedBlooks = profile.ownedBlooks;
              equippedBlook = profile.equippedBlook;
            };
            userProfiles.add(userPrincipal, updatedProfile);
          };
          case (null) {};
        };
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [User.User] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    users.values().toArray().sort();
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };
    users.remove(user);
    userProfiles.remove(user);
  };

  // Question sets storage
  let questionSets = Map.empty<Nat, QuestionSet.QuestionSet>();
  var nextQuestionSetId = 0;

  public shared ({ caller }) func submitQuestionSet(title : Text, questions : [Question]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit question sets");
    };

    let questionSet : QuestionSet.QuestionSet = {
      id = nextQuestionSetId;
      title;
      creator = caller;
      questions;
      isPublic = true;
    };
    questionSets.add(nextQuestionSetId, questionSet);
    nextQuestionSetId += 1;
    questionSet.id;
  };

  public query func searchQuestionSets(search : Text) : async [QuestionSet.QuestionSet] {
    // Public function - no authorization required (guests can search)
    let allQuestionSets = questionSets.values();
    let filtered = allQuestionSets.filter(
      func(set) {
        set.title.contains(#text search) and set.isPublic;
      }
    );
    filtered.toArray().sort();
  };

  public query ({ caller }) func getQuestionSet(id : Nat) : async ?QuestionSet.QuestionSet {
    // Users can view public question sets or their own private sets
    switch (questionSets.get(id)) {
      case (null) { null };
      case (?set) {
        if (set.isPublic or set.creator == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?set;
        } else {
          Runtime.trap("Unauthorized: Cannot view private question set");
        };
      };
    };
  };

  // Shop
  let shopBlooks = Map.empty<Text, Blook>();

  public shared ({ caller }) func buyBlook(blookName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can buy blooks");
    };

    switch (shopBlooks.get(blookName)) {
      case (null) { Runtime.trap("Blook does not exist") };
      case (?blook) {
        switch (users.get(caller)) {
          case (null) { Runtime.trap("User does not exist") };
          case (?user) {
            if (user.coins < blook.cost) {
              Runtime.trap("Insufficient coins");
            };

            let updatedUser : User.User = {
              id = user.id;
              name = user.name;
              coins = user.coins - blook.cost;
              xp = user.xp;
            };
            users.add(caller, updatedUser);

            // Update profile
            switch (userProfiles.get(caller)) {
              case (?profile) {
                let updatedBlooks = profile.ownedBlooks.concat([blookName]);
                let updatedProfile : UserProfile = {
                  name = profile.name;
                  coins = profile.coins - blook.cost;
                  xp = profile.xp;
                  ownedBlooks = updatedBlooks;
                  equippedBlook = profile.equippedBlook;
                };
                userProfiles.add(caller, updatedProfile);
              };
              case (null) {};
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getShopBlooks() : async [(Text, Blook)] {
    // Public function - anyone can view shop (including guests)
    shopBlooks.entries().toArray();
  };

  public shared ({ caller }) func addShopBlook(name : Text, cost : Nat, rarity : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add shop blooks");
    };

    let blook : Blook = {
      name;
      rarity;
      cost;
    };
    shopBlooks.add(name, blook);
  };

  public query ({ caller }) func getUser() : async ?User.User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user data");
    };
    users.get(caller);
  };

  public query ({ caller }) func getLeaderboard() : async [User.User] {
    // Public function - anyone can view leaderboard (including guests)
    let allUsers = users.values().toArray();
    let sorted = allUsers.sort(
      func(a : User.User, b : User.User) : Order.Order {
        let scoreA = a.coins + a.xp;
        let scoreB = b.coins + b.xp;
        Nat.compare(scoreB, scoreA); // Descending order
      }
    );

    // Return top 20
    if (sorted.size() <= 20) {
      sorted;
    } else {
      sorted.sliceToArray(0, 20);
    };
  };
};
