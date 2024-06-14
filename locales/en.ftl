language_selected = Language set to English
select_command = Please select a command

start_command =
 It's a bot for creating posts on your site.
    <em>Specially for clients of web development studio "WebDevl".</em>
    
 Your telegram id - <b>{$id}</b>. Pass it to the administrator to give access to the bot. Give it to the administrator to give access to the bot.`
 <em>Re-enter telegram for a full language change</em>

 <b>Write the /faq command for a summary of bot commands.</b>



start = Start and change language
faq = Information about the bot and commands
new_post = Adds a new post
edit_post = Modifies a post by its id
photo = Loads a collection of images based on the same title, description and collection
delete_post = Deletes a post by its id

skip = skip
img_error = An error occurred while downloading the file. Please try again later.
check_error = You are not in the database. If it is an error - contact the creator.

not_text = Your message is not text. Write the command again.
not_category = There is no such category. Selected by default.
not_image = A post without a photo has been selected.

type_title = Type in the title
type_info = Enter the data to create the post.
type_description = Enter a description. If you don't need it, write "Skip" without quotation marks
type_category = Enter a category from the following

img_size = Send image. If you don't have to, post any word. Recommended resolution: {$img_info} pixels.

post_published = The post has been published. Its id is {$postId}



post_updated = Post successfully updated
edit_id = Enter the id of the post you want to edit.
not_id = This is not an id. Write the command again.
id_error = This post doesn't exist. Type the command again.
edit_what = What do you want to change?
img_error = This is not an image. Re-enter the command
none_error = There is no such option. Re-type the command

edit_title = Title
edit_description = Description
edit_category = Category
edit_image = Image

new_title = Enter the text of the new title
new_description = Enter new description text




general_title = Enter a general title
general_description = Enter a general description. If you don't need it, write "Skip" without the quotation marks
general_category = Enter a general category
general_photo = Submit your images. When you are done - write any word you want.
general_published = Posts have been uploaded successfully.
general_img = Finished uploading images



delete_id = Enter the id of the post you want to delete
delete_successfully = Post {$postId} has been successfully deleted.

faq_command =
 <b>/start</b> - command to get telegram id to pass it to the administrator to add it to the bot database. Language change.

 <b>/new_post</b> - command to create a post, asking for: title, description, category and image. When published, the id of the post is written, for further interaction with it.

 <b>/edit_post</b> - command to modify a post by its id. It is possible to change all post data (title, description, etc.).

 <b>/photo</b> - command to upload a collection of images by the same title, description and collection. It is used mainly for publishing images to porftolio.

 <b>/delete_post</b> - deletes a post by its id.