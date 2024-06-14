const fs = require("fs");
require("dotenv").config();
const {
  conversations,
  createConversation,
} = require("@grammyjs/conversations");
const { Bot, GrammyError, HttpError, Keyboard, session } = require("grammy");

const { hydrateFiles } = require("@grammyjs/files");
const { I18n } = require("@grammyjs/i18n");

const bot = new Bot(process.env.BOT_API_KEY);
bot.api.config.use(hydrateFiles(bot.token));
var wp;
let userNameInfo1;
let categoriesInfo = new Set();

const WPAPI = require("wpapi");
const credentials = JSON.parse(process.env.CREDENTIALS);

bot.use(
  session({
    initial: () => ({}),
  })
);
bot.use(conversations());
let i18n = new I18n({
  defaultLocale: "en",
  useSession: true,
  directory: "locales",
});
bot.use(i18n);

async function greeting(conversation, ctx) {
  //> СОЗДАНИЕ ПОСТА
  await ctx.reply(ctx.t("type_title"));
  const title = await conversation.wait();
  if (typeof title.msg.text !== "string") {
    await ctx.reply(ctx.t("not_text"));
    return;
  }

  await ctx.reply(ctx.t("type_description"));
  let description = await conversation.wait();
  if (typeof description.msg.text !== "string") {
    await ctx.reply(ctx.t("not_text"));
    return;
  }
  if (description.msg.text.toLowerCase() == ctx.t("skip").toLowerCase()) {
    description.msg.text = "";
  }
  if (typeof description.msg.text !== "string") {
    await ctx.reply(ctx.t("not_text"));
    return;
  }

  const objectsArray = Array.from(categoriesInfo).map((jsonString) =>
    JSON.parse(jsonString)
  );
  const labels = objectsArray.map((obj) => `${obj.name}(${obj.id})`);

  const buttonRows = labels.reverse().map((label) => [Keyboard.text(label)]);
  const postKeyBoard = Keyboard.from(buttonRows).resized().row();

  await ctx.reply(ctx.t("type_category"), {
    reply_markup: postKeyBoard,
  });
  const categoryName = await conversation.wait();

  let categoryReg = categoryName.msg.text.match(/\((\d+)\)/);

  let categoryNum;
  if (categoryReg) {
    categoryNum = categoryReg[1];
  } else {
    await ctx.reply(ctx.t("not_category"));
    categoryNum = 1;
  }

  await ctx.reply(
    ctx.t(`img_size`, {
      img_info: credentials[userNameInfo1].imgSize,
    })
  );

  const imageObj = await conversation.wait();
  if (imageObj.msg?.text) {
    await ctx.reply(ctx.t("not_image"));
    wp.posts()
      .create({
        //. создаение поста
        title: `${title.msg.text}`,
        content: `${description.msg.text}`,
        categories: [categoryNum],
        status: "publish",
      })
      .then((postResponse) => {
        ctx.reply(
          ctx.t(`post_published`, {
            postId: postResponse.id,
          })
        );
        return true;
      });
  } else {
    const file = await ctx.api.getFile(
      imageObj.update.message.photo[imageObj.update.message.photo.length - 1]
        .file_id
    );
    try {
      if (file.getUrl !== "download") {
        const path = await file.download(
          `temp_images/${file.file_unique_id}.png`
        );

        let name = path.split("/");
        name = name[name.length - 1];

        wp.media()
          .file(`${path}`)
          .create({
            title: `${name}`,
            alt_text: `${name}`,
            caption: `${name}`,
            description: `${name}`,
          })
          .then((response) => {
            wp.posts()
              .create({
                //. создаение поста

                title: `${title.msg.text}`,
                content: `${description.msg.text}`,
                categories: [categoryNum],
                featured_media: response.id,
                status: "publish",
              })
              .then((postResponse) => {
                ctx.reply(
                  ctx.t(`post_published`, {
                    postId: postResponse.id,
                  })
                );
                fs.unlink(path, (err) => {
                  if (err) throw err;
                  console.log("Deleted");
                });
              });
          });
      }
    } catch (error) {
      ctx.reply(ctx.t("img_error"));
    }
  }
}

async function checkID(ctx) {
  switch (Number(ctx.from.id)) {
    case Number(credentials.AliveWeb.id):
      await newWP("AliveWeb");
      break;
    case Number(credentials.WebDevl.id):
      await newWP("WebDevl");
      break;
    default:
      ctx.reply(ctx.t("check_error"));
      return false;
  }
}
async function newWP(userNameInfo) {
  userNameInfo1 = userNameInfo;
  wp = new WPAPI({
    endpoint: credentials[userNameInfo].baseURL,
    username: credentials[userNameInfo].username,
    password: credentials[userNameInfo].password,
  });
}

async function updateCategories() {
  wp.categories()
    .get()
    .then(function (categories) {
      for (const key in categories) {
        if (categories[key].hasOwnProperty("name")) {
          let categorie = {
            name: categories[key].name,
            id: categories[key].id,
          };
          categoriesInfo.add(JSON.stringify(categorie));
        }
      }
    });
}
bot.use(createConversation(greeting));

bot.command("new_post", async (ctx) => {
  if ((await checkID(ctx)) == false) return;
  await updateCategories();
  await ctx.reply(ctx.t("type_info"));
  await ctx.conversation.enter("greeting");
});

async function editPost(id, answer, text, ctx) {
  wp.posts()
    .id(id)
    .update({
      [answer]: text,
    })
    .then(function () {
      ctx.reply(ctx.t("post_updated"));
    });
}

async function editPostInfo(conversation, ctx) {
  await ctx.reply(ctx.t("edit_id"));
  const postId = await conversation.wait();
  if (typeof +postId.msg.text !== "number" || isNaN(+postId.msg.text)) {
    await ctx.reply(ctx.t("not_id"));
    return;
  }
  let abc = await wp
    .posts()
    .id(+postId.msg.text)
    .get()
    .then(function (response) {
      return true;
    })
    .catch(function () {
      ctx.reply(ctx.t("id_error"));
      return false;
    });
  if (!abc) return;

  const keyboard = new Keyboard()
    .text(ctx.t("edit_title"))
    .row()
    .text(ctx.t("edit_description"))
    .row()
    .text(ctx.t("edit_category"))
    .row()
    .text(ctx.t("edit_image"))
    .row()
    .resized();

  await ctx.reply(ctx.t("edit_what"), {
    reply_markup: keyboard,
  });
  const whatChange = await conversation.wait();
  let answer;
  let text;
  switch (whatChange.msg.text.toLowerCase()) {
    case ctx.t("edit_title").toLowerCase():
      answer = "title";
      await ctx.reply(ctx.t("new_title"));
      text = await conversation.wait();
      if (typeof text.msg.text !== "string") {
        await ctx.reply(ctx.t("not_text"));
        return;
      }
      editPost(+postId.msg.text, answer, text.msg.text, ctx);
      break;

    case ctx.t("edit_description").toLowerCase():
      answer = "content";
      await ctx.reply(ctx.t("new_description"));
      text = await conversation.wait();
      if (typeof text.msg.text !== "string") {
        await ctx.reply(ctx.t("not_text"));
        return;
      }
      editPost(+postId.msg.text, answer, text.msg.text, ctx);
      break;

    case ctx.t("edit_category").toLowerCase():
      answer = "categories";

      const objectsArray = Array.from(categoriesInfo).map((jsonString) =>
        JSON.parse(jsonString)
      );
      const labels = objectsArray.map((obj) => `${obj.name}(${obj.id})`);

      const buttonRows = labels
        .reverse()
        .map((label) => [Keyboard.text(label)]);
      const postKeyBoard = Keyboard.from(buttonRows).resized().row();

      await ctx.reply(ctx.t("type_category"), {
        reply_markup: postKeyBoard,
      });
      const categoryName = await conversation.wait();
      if (typeof categoryName.msg.text !== "string") {
        if (typeof text.msg.text !== "string") {
          await ctx.reply(ctx.t("not_text"));
          return;
        }
        return;
      }
      let categoryReg = categoryName.msg.text.match(/\((\d+)\)/);

      if (categoryReg) {
        text = [categoryReg[1]];
      } else {
        await ctx.reply(ctx.t("not_category"));

        text = [1];
      }
      editPost(+postId.msg.text, answer, text, ctx);
      break;

    case ctx.t("edit_image").toLowerCase():
      answer = "featured_media";
      await ctx.reply(
        ctx.t(`img_size`, {
          img_info: credentials[userNameInfo1].imgSize,
        })
      );
      const imageObj = await conversation.wait();

      if (imageObj.update.message.photo == undefined) {
        await ctx.reply(ctx.t("img_error"));
        return;
      }

      const file = await ctx.api.getFile(
        imageObj.update.message.photo[imageObj.update.message.photo.length - 1]
          .file_id
      );
      try {
        if (file.getUrl !== "download") {
          const path = await file.download(
            `temp_images/${file.file_unique_id}.png`
          );
          let name = path.split("/");
          name = name[name.length - 1];

          wp.media()
            .file(`${path}`)
            .create({
              title: `${name}`,
              alt_text: `${name}`,
              caption: `${name}`,
              description: `${name}`,
            })
            .then(function (response) {
              text = response.id;
              editPost(+postId.msg.text, answer, text, ctx);
            })
            .then(function () {
              fs.unlink(path, (err) => {
                if (err) throw err;
                console.log("Deleted");
              });
            });
        }
      } catch (error) {
        ctx.reply(ctx.t("img_error"));
      }

      break;
    default:
      await ctx.reply(ctx.t("none_error"));
      return;
  }
}

bot.use(createConversation(editPostInfo));
bot.command("edit_post", async (ctx) => {
  if ((await checkID(ctx)) == false) return;
  await updateCategories();
  await ctx.conversation.enter("editPostInfo");
});

async function uploadPhotos(conversation, ctx) {
  await ctx.reply(ctx.t("general_title"));
  const title = await conversation.wait();

  await ctx.reply(ctx.t("general_description"));
  let description = await conversation.wait();
  if (description.msg.text.toLowerCase() == "пропустить") {
    description.msg.text = "";
  }

  let category;
  const objectsArray = Array.from(categoriesInfo).map((jsonString) =>
    JSON.parse(jsonString)
  );
  const labels = objectsArray.map((obj) => `${obj.name}(${obj.id})`);

  const buttonRows = labels.reverse().map((label) => [Keyboard.text(label)]);
  const postKeyBoard = Keyboard.from(buttonRows).resized().row();

  await ctx.reply(ctx.t("general_category"), {
    reply_markup: postKeyBoard,
  });
  const categoryName = await conversation.wait();
  if (typeof categoryName.msg.text !== "string") {
    await ctx.reply(ctx.t("not_text"));
    return;
  }
  let categoryReg = categoryName.msg.text.match(/\((\d+)\)/);

  if (categoryReg) {
    category = [categoryReg[1]];
  } else {
    await ctx.reply(ctx.t("not_category"));
    category = [1];
  }

  await ctx.reply(ctx.t("general_photo"));
  let test1 = {
    msg: {
      text: "",
    },
  };
  while (!test1.msg.text) {
    let imageObj = await conversation.wait();
    if (imageObj.msg.text) {
      await ctx.reply(ctx.t("general_img"));
      return;
    }

    let file = await ctx.api.getFile(
      imageObj.update.message.photo[imageObj.update.message.photo.length - 1]
        .file_id
    );
    try {
      if (
        typeof file.getUrl == "function" &&
        typeof file.download == "function"
      ) {
        const path = await file.download(
          `temp_images/${file.file_unique_id}.png`
        );
        let name = path.split("/");
        name = name[name.length - 1];

        wp.media()
          .file(`${path}`)
          .create({
            title: `${name}`,
            alt_text: `${name}`,
            caption: `${name}`,
            description: `${name}`,
          })

          .then((response) => {
            wp.posts()
              .create({
                //. создаение поста
                title: `${title.msg.text}`,
                content: `${description.msg.text}`,
                categories: category,
                featured_media: response.id,
                status: "publish",
              })
              .then(function (response) {
                ctx.reply(
                  ctx.t(`post_published`, {
                    postId: response.id,
                  }),
                  {
                    reply_parameters: { message_id: imageObj.msg.message_id },
                  }
                );
                fs.unlink(path, (err) => {
                  if (err) throw err;
                  console.log("Deleted");
                });
              })
              .catch(function (error) {
                console.log(error);
              });
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    } catch (error) {
      ctx.reply(ctx.t("img_error"));
    }
  }
}

bot.use(createConversation(uploadPhotos));
bot.command("photo", async (ctx) => {
  if ((await checkID(ctx)) == false) return;
  await updateCategories();
  await ctx.conversation.enter("uploadPhotos");
});

async function deletePost(conversation, ctx) {
  await ctx.reply(ctx.t("delete_id"));
  const postId = await conversation.wait();
  if (typeof +postId.msg.text !== "number" || isNaN(+postId.msg.text)) {
    await ctx.reply(ctx.t("not_id"));
    return;
  }
  let abc = await wp
    .posts()
    .id(+postId.msg.text)
    .get()
    .then(function (response) {
      wp.posts()
        .id(+postId.msg.text)
        .delete()
        .then(function () {
          ctx.reply(
            ctx.t(`delete_successfully`, {
              postId: +postId.msg.text,
            })
          );
        })
        .catch(function () {
          ctx.reply(ctx.t("id_error"));
          return false;
        });
      return true;
    })
    .catch(function () {
      ctx.reply(ctx.t("id_error"));
      return false;
    });
  if (!abc) return;
}

bot.use(createConversation(deletePost));
bot.command("delete_post", async (ctx) => {
  if ((await checkID(ctx)) == false) return;
  await updateCategories();
  await ctx.conversation.enter("deletePost");
});

//> языки

async function language(conversation,ctx) {
  await ctx.reply(
    ctx.t(`start_command`, {
      id: String(ctx.from.id),
    }),
    {
      parse_mode: "HTML",
    }
  );
  await test(ctx);
}

bot.use(createConversation(language));

bot.command("start", async (ctx) => {
  await ctx.i18n.setLocale(ctx.from.language_code);
  await ctx.conversation.enter("language");
});

async function test(ctx) {
  bot.api.setMyCommands([
    { command: "start", description: ctx.t("start") },
    { command: "faq", description: ctx.t("faq") },
    { command: "new_post", description: ctx.t("new_post") },
    { command: "edit_post", description: ctx.t("edit_post") },
    { command: "photo", description: ctx.t("photo") },
    { command: "delete_post", description: ctx.t("delete_post") },
  ]);
}

bot.command("faq", async (ctx) => {
  await ctx.reply(ctx.t("faq_command"), {
    parse_mode: "HTML",
  });
});

bot.on("message", async (ctx) => {
  await ctx.reply(ctx.t("select_command"));
});

bot.api.setMyCommands([
  { command: "start", description: "Start and change language" },
  { command: "faq", description: "Information about the bot and commands" },
  { command: "new_post", description: "Adds a new post" },
  { command: "edit_post", description: "Modifies a post by its id" },
  {
    command: "photo",
    description:
      "Loads a collection of images based on the same title, description and collection",
  },
  { command: "delete_post", description: "Deletes a post by its id" },
]);

bot.catch((err) => {
  console.log(err);
  const ctx = err.ctx;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Ошибка при запросе:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Не могу связаться с Телеграм:", e);
  } else {
    console.error("Неизвестная ошибка:", e);
  }
});
bot.start();
