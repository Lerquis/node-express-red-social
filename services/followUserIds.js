const Follow = require("../models/Follow");

const followUserIds = async (identityUserId) => {
  // Sacamos todos los follows donde identityUserId sea el que sigue
  try {
    let following = await Follow.find({ user: identityUserId }).select({
      followed: 1,
      _id: 0,
    });
    let followers = await Follow.find({ followed: identityUserId }).select({
      user: 1,
      _id: 0,
    });
    // Procesamos array de identificadores
    let followingClean = [];
    following.forEach((follow) => {
      followingClean.push(follow.followed);
    });
    let followersClean = [];
    followers.forEach((follow) => {
      followersClean.push(follow.user);
    });

    return { following: followingClean, followers: followersClean };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const followThisUser = async (identityUserId, profileUserId) => {
  try {
    // Sacamos la informacion de si lo sigo y de si me sigue
    let following = await Follow.findOne({
      user: identityUserId,
      followed: profileUserId,
    }).select({
      followed: 1,
      _id: 0,
    });
    let followers = await Follow.find({
      followed: identityUserId,
      user: profileUserId,
    }).select({
      user: 1,
      _id: 0,
    });

    // Devolvemos la respuesta de si nos sigue el usuario, y si seguimos el usuario
    return { following: following !== null, followed: followers !== null };
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports = { followUserIds, followThisUser };
