use rand::RngCore;
use rocket::http::private::cookie::Expiration;
use rocket::http::{CookieJar, Cookie};
use ron::de::from_bytes;
use serde::{Deserialize, Serialize};
use sha3::{Digest, Sha3_256};
use lazy_static::lazy_static;
use rand::distributions::Alphanumeric;
use rand::Rng;

lazy_static! {
    pub static ref ACCESS_KEY: String = {
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(64)
            .map(char::from)
            .collect()
    };
}

pub struct UserDatabase {
    pub user_db: sled::Db,
    pub chat_db: sled::Db,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UserData {
    pub salted_hash: Vec<u8>,
    pub name: String,
    pub email: String,
    pub dob: String,
    pub friends: Vec<(String, String)>,
    pub wr: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Message {
    pub date: String,
    pub time: String,
    pub sender: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Chat {
    pub participants: Vec<String>,
    pub messages: Vec<Message>,
    pub last_seen: Vec<usize>,
}

impl UserDatabase {
    pub fn new() -> Result<Self, sled::Error> {
        Ok(UserDatabase {
            user_db: sled::open("content/user.tree")?,
            chat_db: sled::open("content/chat.tree")?,
        })
    }

    pub fn get_user_data(&self, username: &str) -> Option<UserData> {
        Some(from_bytes(&self.user_db.get(username).ok()??).unwrap())
    }

    pub fn get_chat(&self, username: &str, target_chat_id: &str) -> Option<Chat> {
        let mut chat: Chat = ron::de::from_bytes(self.chat_db.get(target_chat_id.as_bytes()).ok()?.as_ref()?).ok()?;
        chat.last_seen[chat.participants.iter().position(|p| dbg!(p) == dbg!(username)).unwrap()] = chat.messages.len();
        self.chat_db.insert(target_chat_id.as_bytes(), ron::to_string(&chat).unwrap().as_bytes().to_vec()).unwrap();
        dbg!(&chat.last_seen);
        Some(chat)
    }

    pub fn create_chat(&self, participants: Vec<String>) -> anyhow::Result<String> {
        let chat_id = self.chat_db.generate_id()?.to_string();
        let last_seen = participants.iter().enumerate().map(|(i, _)| i).collect();
        let new_chat = Chat {
            participants,
            messages: Vec::new(),
            last_seen, 
        };
        self.chat_db.insert(
            chat_id.clone(),
            ron::to_string(&new_chat).unwrap().as_bytes(),
        )?;
        Ok(chat_id)
    }

    pub fn make_friends<S: Into<String>>(&self, user_1: S, user_2: S) -> anyhow::Result<()> {
        let user_1 = user_1.into();
        let user_2 = user_2.into();

        if user_1 == user_2 {
            return Err(anyhow::Error::msg("Cannot become friends with yourself"));
        }

        // Create new chat for the two friends
        let chat_id = self.create_chat(vec![user_1.clone(), user_2.clone()])?;

        if !self.user_db.contains_key(&user_1).unwrap_or(false)
            || !self.user_db.contains_key(&user_2).unwrap_or(false)
        {
            return Err(anyhow::Error::msg("User doesn't exist"));
        }

        // Add to each others friend list
        let mut already_friends = false;
        self.user_db.fetch_and_update(&user_1, |maybe_user_data| {
            let mut user_data: UserData = ron::de::from_bytes(maybe_user_data.as_ref()?).ok()?;
            already_friends = user_data
                .friends
                .iter()
                .any(|(friend, _)| friend == &user_2);
            if !already_friends {
                user_data.friends.push((user_2.clone(), chat_id.clone()));
            }
            Some(ron::to_string(&user_data).unwrap().as_bytes().to_vec())
        })?;
        if already_friends {
            return Err(anyhow::Error::msg("Already friends"));
        }
        self.user_db.fetch_and_update(&user_2, |maybe_user_data| {
            let mut user_data: UserData = ron::de::from_bytes(maybe_user_data.as_ref()?).ok()?;
            already_friends = user_data
                .friends
                .iter()
                .any(|(friend, _)| friend == &user_1);
            if !already_friends {
                user_data.friends.push((user_1.clone(), chat_id.clone()));
            }
            Some(ron::to_string(&user_data).unwrap().as_bytes().to_vec())
        })?;
        if already_friends {
            return Err(anyhow::Error::msg("Already friends"));
        }
        Ok(())
    }

    pub fn create_user(
        &self,
        username: &str,
        password: &str,
        name: &str,
        email: &str,
        dob: &str,
    ) -> anyhow::Result<()> {
        // Generate salt & hash
        let mut hasher = Sha3_256::new();
        let mut rng = rand::thread_rng();
        let mut salt: [u8; 32] = [0; 32];
        rng.fill_bytes(&mut salt);
        hasher.update(salt);
        hasher.update(password.as_bytes());

        // Store salt + hash
        let mut salted_hash = Vec::with_capacity(64);
        salted_hash.extend_from_slice(&salt);
        salted_hash.extend_from_slice(&hasher.finalize()[..]);
        assert!(salted_hash.len() == 64);
        let user_data = UserData {
            salted_hash,
            name: name.to_string(),
            email: email.to_string(),
            dob: dob.to_string(),
            friends: Vec::new(),
            wr: String::new(),
        };

        self.user_db
            .insert(username, ron::to_string(&user_data)?.as_bytes())?;

        std::fs::copy(
            "./src/data/assets/img/profiles/default.png",
            format!("./src/data/assets/img/profiles/{}.png", username),
        )?;
        Ok(())
    }

    pub fn authorise(&self, username: &str, password: &str, cookies: &CookieJar<'_>) -> anyhow::Result<bool> {
        if let Some(user_data_bin) = self.user_db.get(username)? {
            let user_data: UserData = from_bytes(&user_data_bin)?;
            let hash_and_salt = user_data.salted_hash;
            let salt = &hash_and_salt[..32];
            let salted_hash = &hash_and_salt[32..];

            let mut hasher = Sha3_256::new();
            hasher.update(salt);
            hasher.update(password.as_bytes());

            // Store cookies
            cookies.add_private(
                Cookie::build("auth_key", ACCESS_KEY.as_str())
                    .expires(Expiration::Session)
                    .finish(),
            );
            cookies.add_private(Cookie::build("username", username.to_string()).finish());
            cookies.add(Cookie::build("USER", username.to_string()).finish());

            Ok(&hasher.finalize()[..] == salted_hash)
        } else {
            Ok(false)
        }
    }
}

pub fn has_auth(cookies: &CookieJar<'_>) -> bool {
    cookies.get_private("auth_key").map(|auth_key| auth_key.value() == ACCESS_KEY.as_str()).unwrap_or(false)
}