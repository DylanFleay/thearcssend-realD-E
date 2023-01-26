mod auth;

use std::path::PathBuf;

use auth::{Chat, Message, UserData, UserDatabase, has_auth};
use chrono::{Datelike, Timelike, Utc};
use rocket::http::{ContentType, Cookie, CookieJar};
use rocket::response::content::RawJson;
use rocket::response::stream::{Event, EventStream};
use rocket::response::Redirect;
use rocket::State;
use rocket::{fs::FileServer, response::content::RawHtml};
use serde::{Deserialize, Serialize};

#[macro_use]
extern crate rocket;
use rocket::form::Form;
use rocket::fs::{relative, NamedFile, TempFile};

#[get("/home.html")]
fn home(cookies: &CookieJar<'_>) -> Result<RawHtml<String>, Redirect> {
    if has_auth(cookies) {
        Ok(RawHtml(std::fs::read_to_string("./src/data/home.html").unwrap()))
    } else {
        Err(Redirect::to(uri!(login)))
    }
}

#[get("/favicon.ico")]
async fn favicon() -> Result<NamedFile, std::io::Error> {
    NamedFile::open("src/data/assets/img/favicon.ico").await
}

#[get("/")]
fn index(cookies: &CookieJar<'_>) -> Redirect {
    if has_auth(cookies) {
        Redirect::to(uri!(home))
    } else {
        Redirect::to(uri!(login))
    }
}

#[get("/login.html")]
fn login() -> RawHtml<&'static str> {
    RawHtml(include_str!("./data/login.html"))
}

#[get("/create_account.html")]
fn create_account() -> RawHtml<&'static str> {
    RawHtml(include_str!("./data/create_account.html"))
}

#[derive(FromForm)]
struct AuthForm<'r> {
    username: &'r str,
    password: &'r str,
}


#[post("/CheckAuth", data = "<auth_form>")]
fn check_auth(
    state: &State<UserDatabase>,
    auth_form: Form<AuthForm<'_>>,
    cookies: &CookieJar<'_>,
) -> Redirect {
    println!("{}", auth_form.username);
    println!("{}", auth_form.password);

    let is_authorised = state.authorise(auth_form.username, auth_form.password, cookies).unwrap_or(false);
    if is_authorised {
        Redirect::to(uri!(home))
    } else {
        Redirect::to(uri!(login))
    }
}

#[derive(FromForm)]
struct CreateUserForm<'r> {
    username: &'r str,
    password: &'r str,
    password_d: &'r str,
    name: &'r str,
    email: &'r str,
    dob: &'r str,
}

#[post("/CreateNewUser", data = "<create_user_form>")]
fn create_new_user(
    state: &State<UserDatabase>,
    create_user_form: Form<CreateUserForm<'_>>,
) -> Redirect {
    println!("-------- Storing Creds ---------");
    println!("{}", create_user_form.username);
    println!("{}", create_user_form.password);

    if create_user_form.password != create_user_form.password_d {
        println!("Passwords don't match");
    }

    state
        .create_user(
            create_user_form.username,
            create_user_form.password,
            create_user_form.name,
            create_user_form.email,
            create_user_form.dob,
        )
        .unwrap();
    Redirect::to(uri!(login))
}

#[derive(FromForm)]
struct ChatForm<'r> {
    target: &'r str,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ChatReply {
    name: String,
    messages: Vec<(String, String, String, String)>,
}

#[derive(FromForm)]
struct SendMsgForm<'r> {
    content: &'r str,
}

#[post("/SendMsg", data = "<send_msg_form>")]
fn send_msg(
    state: &State<UserDatabase>,
    send_msg_form: Form<SendMsgForm<'_>>,
    cookies: &CookieJar<'_>,
) {
    let username = cookies.get_private("username").unwrap().value().to_string();
    let chat_id = cookies.get_private("chat_id").unwrap().value().to_string();

    // Log message
    println!("-------- Send Msg ---------");
    println!("Who?: chat from {} to chat id {}", username, chat_id);
    println!("What?: '{}'", send_msg_form.content);

    let mut chat = state.get_chat(&username, chat_id.as_str()).unwrap();

    // Add message to chat
    let now = Utc::now();
    chat.messages.push(Message {
        date: format!("{:02}/{:02}/{}", now.day(), now.month(), now.year_ce().1),
        time: format!("{:02}:{:02}", now.hour(), now.minute()),
        sender: username.clone(),
        content: send_msg_form.content.to_owned(),
    });

    state
        .chat_db
        .insert(chat_id, ron::to_string(&chat).unwrap().as_bytes())
        .unwrap();
}

#[post("/GetChat", data = "<chat_form>")]
fn get_chat(
    state: &State<UserDatabase>,
    chat_form: Form<ChatForm<'_>>,
    cookies: &CookieJar<'_>,
) -> RawJson<String> {
    let username = cookies.get_private("username").unwrap().value().to_string();
    println!("-------- Get Chat ---------");
    println!("chat from {} to {}", username, chat_form.target);
    cookies.add(Cookie::build("chat", chat_form.target.to_owned()).finish());
    let user_data = state.get_user_data(username.as_str()).unwrap();
    let (_, chat_id) = user_data
        .friends
        .iter()
        .find(|(friend, _)| friend == chat_form.target)
        .unwrap();
    let chat = state.get_chat(&username, chat_id.as_str()).unwrap();
    cookies.add_private(Cookie::build("chat_id", chat_id.clone()).finish());
    let mut chat_reply = ChatReply {
        name: chat
            .participants
            .iter()
            .find(|user| user.as_str() != username)
            .unwrap()
            .to_string(),
        messages: Vec::new(),
    };

    for msg in chat.messages {
        chat_reply
            .messages
            .push((msg.sender, msg.time, msg.date, msg.content));
    }

    RawJson(serde_json::to_string(&chat_reply).unwrap())
}

#[get("/MsgStream")]
fn msg_stream(state: &State<UserDatabase>, cookies: &CookieJar<'_>) -> EventStream![] {
    let mut subscriber = state.chat_db.watch_prefix(vec![]);
    let chat_id = cookies.get_private("chat_id").unwrap();
    let username = cookies.get_private("username").unwrap();
    EventStream! { 
        while let Some(event) = (&mut subscriber).await {
            match event {
                sled::Event::Insert { key: updated_chat_id, value } => {
                    if chat_id.value().as_bytes() == updated_chat_id.as_ref() {
                        let chat: Chat = ron::de::from_bytes(&value).unwrap();
                        yield Event::json(&chat.messages.last().unwrap())
                    } else if let Ok(chat) = ron::de::from_bytes::<Chat>(&value) {
                        if let Some(pos) = chat.participants.iter().position(|p| p == username.value()) {
                            yield Event::json(&chat.messages.last().unwrap())
                        }
                    }
                }
                _ => {}
            }
        }
    }
}

#[derive(FromForm)]
struct AddFriendForm<'r> {
    username: &'r str,
}

#[post("/AddFriend", data = "<add_friend_form>")]
fn add_friend(
    state: &State<UserDatabase>,
    add_friend_form: Form<AddFriendForm<'_>>,
    cookies: &CookieJar<'_>,
) -> String {
    let username = cookies.get_private("username").unwrap().value().to_string();
    println!("-------- Add Friend ---------");
    println!("{} adding friend {}", username, add_friend_form.username);
    if let Err(e) = state.make_friends(&username, &add_friend_form.username.to_string()) {
        e.to_string()
    } else {
        "Successfully added friend".to_owned()
    }
}

#[derive(FromForm)]
struct SetWrForm<'r> {
    new_list: &'r str,
}

#[post("/SetWR", data = "<set_wr_form>")]
fn set_wr(state: &State<UserDatabase>, set_wr_form: Form<SetWrForm<'_>>, cookies: &CookieJar<'_>) {
    let username = cookies.get_private("username").unwrap().value().to_string();
    println!("-------- Set Word Replace ---------");
    println!(
        "{} adding word replace : '{}'",
        username, set_wr_form.new_list
    );
    let outcome = state
        .user_db
        .fetch_and_update(&username, |maybe_user_data| {
            let mut user_data: UserData = ron::de::from_bytes(maybe_user_data.as_ref()?).ok()?;
            user_data.wr = set_wr_form.new_list.to_string();
            Some(ron::to_string(&user_data).unwrap().as_bytes().to_vec())
        });
    if outcome.is_err() {
        println!("Set word replace failed")
    };
}

#[get("/GetWR")]
fn get_wr(state: &State<UserDatabase>, cookies: &CookieJar<'_>) -> Option<String> {
    let username = cookies.get_private("username")?.value().to_string();
    state
        .user_db
        .get(username)
        .ok()
        .and_then(|user| Some(ron::de::from_bytes::<UserData>(user.as_ref()?).ok()?.wr))
}

#[derive(FromForm)]
struct GetPFPForm<'r> {
    target: &'r str,
}

#[post("/GetPfp", data = "<get_pfp_form>")]
fn get_pfp(get_pfp_form: Form<GetPFPForm<'_>>) -> Option<String> {
    let mut output = String::new();
    output.push_str("/en/assets/img/profiles/");
    let mut path = PathBuf::new();
    path.push("src/data/assets/img/profiles/");
    path.push(get_pfp_form.target);
    path.set_extension("png");
    if path.exists() {
        output.push_str(get_pfp_form.target);
        output.push_str(".png");
    } else {
        path.set_extension("jpg");
        if path.exists() {
            output.push_str(get_pfp_form.target);
            output.push_str(".jpg");
        } else {
            output.push_str("default.png");
        }
    }
    Some(output)
}

#[derive(Serialize)]
pub struct FriendList {
    friends: Vec<String>,
}

#[get("/GetFriends")]
fn get_friends(state: &State<UserDatabase>, cookies: &CookieJar<'_>) -> Option<RawJson<String>> {
    let username = cookies.get_private("username")?.value().to_string();
    let mut friends = Vec::new();
    let user_data: UserData = ron::de::from_bytes(&state.user_db.get(username).ok()??).ok()?;
    for friend in user_data.friends {
        friends.push(friend.0);
    }
    let friend_list = FriendList { friends };
    Some(RawJson(serde_json::to_string(&friend_list).unwrap()))
}

#[derive(FromForm)]
struct SetPFPForm<'r> {
    file: TempFile<'r>,
}

#[post("/ChangePFP", data = "<set_pfp_form>")]
async fn change_pfp(mut set_pfp_form: Form<SetPFPForm<'_>>, cookies: &CookieJar<'_>) -> String {
    let username = cookies.get_private("username").unwrap().value().to_string();
    println!("-------- Set Profile Picture ---------");
    println!("{} setting pfp", username);

    let mut path = PathBuf::new();
    path.push("src/data/assets/img/profiles/");
    path.push(username.as_str());
    path.set_extension("png");
    if path.exists() {
        std::fs::remove_file(&path).expect("File should be removable");
    }
    path.set_extension("jpg");
    if path.exists() {
        std::fs::remove_file(&path).expect("File should be removable");
    }
    if set_pfp_form.file.content_type() == Some(&ContentType::PNG) {
        path.set_extension("png");
    } else if set_pfp_form.file.content_type() == Some(&ContentType::JPEG) {
        path.set_extension("jpg");
    } else {
        return "Invalid profile picture type".to_owned();
    }
    set_pfp_form.file.persist_to(path).await.unwrap();
    "Success".to_owned()
}

#[launch]
fn rocket() -> _ {
    let user_db = UserDatabase::new().unwrap();
    /*
    user_db
        .create_user(
            "lucas",
            "leoisgay",
            "lucas",
            "timmins.s.lucas@gmail.com",
            "17.04.2003",
        )
        .unwrap();
    user_db
        .create_user(
            "leo",
            "ilikecock",
            "leo",
            "leotimmins1974@gmail.com",
            "23.06.2013",
        )
        .unwrap();
    user_db
        .create_user(
            "dylan",
            "$$$",
            "dylan",
            "suckme@off.com",
            "23.06.2012",
        )
        .unwrap();
    user_db.make_friends("lucas", "leo").unwrap();
    user_db
        .chat_db
        .insert(
            user_db.get_user_data("lucas").unwrap().friends[0].1.clone(),
            ron::to_string(&Chat {
                participants: vec!["lucas".to_owned(), "leo".to_owned()],
                messages: vec![
                    Message {
                        time: "12:01".into(),
                        date: "12/04/2022".into(),
                        sender: "lucas".into(),
                        content: "You're gay leo".into(),
                    },
                    Message {
                        time: "12:02".into(),
                        date: "12/04/2022".into(),
                        sender: "leo".into(),
                        content: "Making out with McDonalds managers doesn't make me gay!".into(),
                    },
                ],
                last_seen: vec![0, 0]
            })
            .unwrap()
            .as_bytes(),
        )
        .unwrap();
        */

    rocket::build()
        .mount(
            "/",
            routes![
                login,
                home,
                create_account,
                check_auth,
                create_new_user,
                favicon,
                index,
                get_chat,
                send_msg,
                msg_stream,
                add_friend,
                get_wr,
                set_wr,
                change_pfp,
                get_pfp,
                get_friends,
            ],
        )
        .mount(
            "/en/assets",
            FileServer::from(relative!("src/data/assets/")),
        )
        .manage(user_db)
}
